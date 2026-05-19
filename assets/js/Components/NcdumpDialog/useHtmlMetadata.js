import { useState, useEffect } from "react";

import { getTokenFromCookie } from "../../utils";

// Zarr metadata parsers

function parseDtypeStr(dtype) {
  const map = {
    f2: "float16",
    f4: "float32",
    f8: "float64",
    i1: "int8",
    i2: "int16",
    i4: "int32",
    i8: "int64",
    u1: "uint8",
    u2: "uint16",
    u4: "uint32",
    u8: "uint64",
    b1: "bool",
  };
  return map[dtype.slice(1)] ?? dtype;
}

/**
 * Given the flat .zmetadata map and a key prefix (e.g. "group0/" or ""),
 * we build a single { dims, coords, data_vars, attrs } dataset object.
 */
// V2: reads from .zmetadata flat key map
function buildDatasetV2(meta, prefix) {
  const attrs = meta[`${prefix}.zattrs`] ?? {};
  const arrays = {};

  for (const [key, val] of Object.entries(meta)) {
    if (!key.startsWith(prefix)) {
      continue;
    }
    const rel = key.slice(prefix.length);
    if (rel.endsWith("/.zarray")) {
      const name = rel.slice(0, -8);
      if (name.includes("/")) {
        continue;
      }
      arrays[name] ??= {};
      arrays[name].zarray = val;
    } else if (rel.endsWith("/.zattrs")) {
      const name = rel.slice(0, -8);
      if (!name || name.includes("/")) {
        continue;
      }
      arrays[name] ??= {};
      arrays[name].zattrs = val;
    }
  }

  return assembleDataset(arrays, attrs, (info) => ({
    shape: info.zarray?.shape ?? [],
    chunks: info.zarray?.chunks ?? info.zarray?.shape ?? [],
    dtype: parseDtypeStr(info.zarray?.dtype ?? "|u1"),
    dims: info.zattrs?._ARRAY_DIMENSIONS ?? [],
    attrs: (({ _ARRAY_DIMENSIONS, ...rest }) => rest)(info.zattrs ?? {}),
  }));
}

function parseV2(json) {
  const meta = json.metadata ?? {};

  const groupNames = new Set();
  for (const key of Object.keys(meta)) {
    if (key === ".zgroup" || key === ".zattrs") {
      continue;
    }
    if (key.endsWith("/.zgroup")) {
      const name = key.slice(0, -8);
      if (!name.includes("/")) {
        groupNames.add(name);
      }
    }
  }

  if (groupNames.size === 0) {
    const ds = buildDatasetV2(meta, "");
    if (!Object.keys({ ...ds.coords, ...ds.data_vars }).length) {
      throw new Error("No arrays found in .zmetadata");
    }
    return { groups: null, ...ds };
  }

  const groups = {};
  for (const name of [...groupNames].sort()) {
    groups[name] = buildDatasetV2(meta, `${name}/`);
  }
  return { groups };
}

// V3: reads from zarr.json consolidated_metadata

function buildDatasetV3(meta, prefix) {
  const rootKey = prefix || "";
  const attrs = (meta[rootKey] ?? {}).attributes ?? {};
  const arrays = {};

  for (const [key, val] of Object.entries(meta)) {
    if (val.node_type !== "array") {
      continue;
    }
    if (prefix) {
      if (!key.startsWith(`${prefix}/`)) {
        continue;
      }
      const rel = key.slice(prefix.length + 1);
      if (rel.includes("/")) {
        continue;
      }
      arrays[rel] = { zarray: val };
    } else {
      if (!key || key.includes("/")) {
        continue;
      }
      arrays[key] = { zarray: val };
    }
  }

  return assembleDataset(arrays, attrs, (info) => {
    const v = info.zarray;
    return {
      shape: v.shape ?? [],
      chunks: v.chunk_grid?.configuration?.chunk_shape ?? v.shape ?? [],
      // v3 is human-readable
      dtype: v.data_type ?? "float32",
      dims: v.dimension_names ?? [],
      attrs: v.attributes ?? {},
    };
  });
}

function parseV3(json) {
  const meta = json.consolidated_metadata?.metadata ?? {};
  if (!Object.keys(meta).length) {
    throw new Error("zarr.json has no consolidated_metadata");
  }

  const groupNames = new Set();
  for (const [key, val] of Object.entries(meta)) {
    if (!key || val.node_type !== "group") {
      continue;
    }
    if (!key.includes("/")) {
      groupNames.add(key);
    }
  }

  if (groupNames.size === 0) {
    const ds = buildDatasetV3(meta, "");
    if (!Object.keys({ ...ds.coords, ...ds.data_vars }).length) {
      throw new Error("No arrays found in zarr.json");
    }
    return { groups: null, ...ds };
  }

  const groups = {};
  for (const name of [...groupNames].sort()) {
    groups[name] = buildDatasetV3(meta, name);
  }
  return { groups };
}

// shared assembly (V2 + V3)
function assembleDataset(arrays, attrs, extract) {
  const dims = {};
  const allVars = {};

  for (const [name, info] of Object.entries(arrays)) {
    const {
      shape,
      chunks,
      dtype,
      dims: dimNames,
      attrs: userAttrs,
    } = extract(info);
    dimNames.forEach((d, i) => {
      if (!(d in dims)) {
        dims[d] = shape[i] ?? 0;
      }
    });
    const isTime =
      dimNames.length === 1 &&
      dimNames[0] === name &&
      (String(userAttrs.units ?? "").includes("since") || name === "time");
    allVars[name] = {
      shape,
      chunks,
      dtype,
      dims: dimNames,
      attrs: userAttrs,
      _isTimeCoord: isTime,
    };
  }

  const coordSet = new Set();
  const splitWords = (s) =>
    String(s ?? "")
      .split(/[\s,]+/)
      .filter(Boolean);
  for (const [name, dv] of Object.entries(allVars)) {
    if (dv.dims.length === 1 && dv.dims[0] === name) {
      coordSet.add(name);
    }
  }
  splitWords(attrs.coordinates).forEach((c) => coordSet.add(c));
  for (const dv of Object.values(allVars)) {
    splitWords(dv.attrs.coordinates).forEach((c) => coordSet.add(c));
  }

  const coords = {},
    data_vars = {};
  for (const [name, dv] of Object.entries(allVars)) {
    (coordSet.has(name) ? coords : data_vars)[name] = dv;
  }
  return { dims, coords, data_vars, attrs };
}

// ── entry point ───────────────────────────────────────────────────────────────
/**
 * Fetches (v2:zmetadata.sjon and v3:zarr.json) and returns either:
 *   { groups: null, ...dataset }; flat store
 *   { groups: { name -> dataset } }; multi-group store
 */
async function openDatasetMeta(url) {
  const base = url.replace(/\/$/, "");
  const token = getTokenFromCookie();
  const headers = token
    ? { Authorization: `${token.token_type} ${token.access_token}` }
    : {};
  const opts = { credentials: "same-origin", headers };

  // Try v2 first, then v3
  let json = null,
    version = 0;

  try {
    const r = await fetch(`${base}/.zmetadata`, opts);
    if (r.ok) {
      json = await r.json();
      version = 2;
    }
  } catch {
    /* I hope linter forgive me */
  }

  if (!json) {
    try {
      const r = await fetch(`${base}/zarr.json`, opts);
      if (r.ok) {
        json = await r.json();
        version = 3;
      }
    } catch {
      /* I hope linter forgive me */
    }
  }

  if (!json) {
    throw new Error("Could not read zarr metadata (.zmetadata or zarr.json)");
  }

  return version === 2 ? parseV2(json) : parseV3(json);
}

// xarray HTML renderer
function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
let _uid = 0;
function uid() {
  return `xr${++_uid}`;
}
function icon(id) {
  return `<svg class="icon xr-${id}"><use xlink:href="#${id}"></use></svg>`;
}

function formatDims(dimSizes, indexedNames) {
  if (!Object.keys(dimSizes).length) {
    return "";
  }
  const lis = Object.entries(dimSizes)
    .map(
      ([d, n]) =>
        `<li><span${indexedNames.has(d) ? " class='xr-has-index'" : ""}>${esc(d)}</span>: ${n}</li>`
    )
    .join("");
  return `<ul class='xr-dim-list'>${lis}</ul>`;
}

function summarizeAttrs(attrs) {
  const entries = Object.entries(attrs);
  if (!entries.length) {
    return "<em>No attributes</em>";
  }
  return `<dl class='xr-attrs'>${entries
    .map(
      ([k, v]) => `<dt><span>${esc(k)} :</span></dt><dd>${esc(String(v))}</dd>`
    )
    .join("")}</dl>`;
}

function previewVar(dv) {
  const total = dv.shape.reduce((a, b) => a * b, 1);
  return total === 0
    ? "[]"
    : `${dv.dtype} (${dv.shape.join(" \u00d7 ")} = ${total.toLocaleString()})`;
}

function fmtBytes(n) {
  if (n < 1024) {
    return n + " B";
  }
  if (n < 1024 ** 2) {
    return (n / 1024).toFixed(2) + " KiB";
  }
  if (n < 1024 ** 3) {
    return (n / 1024 ** 2).toFixed(2) + " MiB";
  }
  return (n / 1024 ** 3).toFixed(2) + " GiB";
}

function buildChunkCube(shape) {
  if (!shape.length) {
    return "";
  }
  const ndim = Math.min(shape.length, 3);
  const s = shape.slice(-ndim);
  const vis = (n) =>
    Math.max(20, Math.min(110, 20 + Math.log10(Math.max(1, n)) * 30));
  const fmt = (n) => n.toLocaleString();
  const fSize = 11;
  const ts = `font-size:${fSize}px;fill:var(--xr-font-color2);font-family:monospace`;

  if (ndim < 3) {
    const W = vis(s[ndim - 1]);
    const H = ndim === 2 ? vis(s[0]) : 12;
    const PAD_LEFT = ndim === 2 ? 42 : 2;
    const PAD_BTM = 16;
    const svgW = PAD_LEFT + W + 4;
    const svgH = H + PAD_BTM;
    return `<svg width="${Math.ceil(svgW)}" height="${Math.ceil(svgH)}"
        viewBox="0 0 ${Math.ceil(svgW)} ${Math.ceil(svgH)}"
        style="overflow:visible;display:block;flex-shrink:0">
      <rect x="${PAD_LEFT}" y="0" width="${W}" height="${H}"
            style="fill:var(--xr-chunk-face);stroke:var(--xr-chunk-edge);stroke-width:0.8"/>
      ${
        ndim === 2
          ? `<text x="${PAD_LEFT - 5}" y="${H / 2 + 4}"
            text-anchor="end" style="${ts}">${fmt(s[0])}</text>`
          : ""
      }
      <text x="${PAD_LEFT + W / 2}" y="${H + PAD_BTM - 3}"
            text-anchor="middle" style="${ts}">${fmt(s[ndim - 1])}</text>
    </svg>`;
  }

  const W = vis(s[2]),
    H = vis(s[1]),
    D = vis(s[0]);
  const sk = 0.5,
    dX = D * sk,
    dY = D * sk * 0.45;
  const PAD_TOP = 16,
    PAD_BTM = 16,
    PAD_RGT = 52;
  const svgW = W + dX + PAD_RGT;
  const svgH = PAD_TOP + H + dY + PAD_BTM;
  const ox = 2,
    oy = PAD_TOP + H + dY;
  return `<svg width="${Math.ceil(svgW)}" height="${Math.ceil(svgH)}"
      viewBox="0 0 ${Math.ceil(svgW)} ${Math.ceil(svgH)}"
      style="overflow:visible;display:block;flex-shrink:0">
    <polygon points="${ox},${oy} ${ox + W},${oy} ${ox + W},${oy - H} ${ox},${oy - H}"
             style="fill:var(--xr-chunk-face);stroke:var(--xr-chunk-edge);stroke-width:0.8"/>
    <polygon points="${ox},${oy - H} ${ox + W},${oy - H} ${ox + W + dX},${oy - H - dY} ${ox + dX},${oy - H - dY}"
             style="fill:var(--xr-chunk-top);stroke:var(--xr-chunk-edge);stroke-width:0.8"/>
    <polygon points="${ox + W},${oy} ${ox + W + dX},${oy - dY} ${ox + W + dX},${oy - H - dY} ${ox + W},${oy - H}"
             style="fill:var(--xr-chunk-side);stroke:var(--xr-chunk-edge);stroke-width:0.8"/>
    <text x="${ox + W / 2}" y="${oy + PAD_BTM - 3}"
          text-anchor="middle" style="${ts}">${fmt(s[2])}</text>
    <text x="${ox + W / 2 + dX / 2}" y="${PAD_TOP - 3}"
          text-anchor="middle" style="${ts}">${fmt(s[1])}</text>
    <text x="${ox + W + dX + 5}" y="${oy - H / 2 - dY / 2 + 4}"
          text-anchor="start" style="${ts}">${fmt(s[0])}</text>
  </svg>`;
}

function buildDataRepr(dv) {
  const { shape, chunks, dtype } = dv;
  const elemBytes =
    {
      int8: 1,
      uint8: 1,
      bool: 1,
      int16: 2,
      uint16: 2,
      int32: 4,
      uint32: 4,
      float32: 4,
      int64: 8,
      uint64: 8,
      float64: 8,
    }[dtype] ?? 4;
  const arrayBytes = shape.reduce((a, b) => a * b, 1) * elemBytes;
  let chunkBytes = null,
    nChunks = null;
  if (chunks && chunks.length === shape.length) {
    chunkBytes = chunks.reduce((a, b) => a * b, 1) * elemBytes;
    nChunks = shape.reduce((tot, s, i) => tot * Math.ceil(s / chunks[i]), 1);
  }
  const td0 = `style="color:var(--xr-font-color3);padding:2px 16px 2px 0;white-space:nowrap;vertical-align:top"`;
  const td1 = `style="padding:2px 16px 2px 0;white-space:nowrap;vertical-align:top"`;
  const td2 = `style="padding:2px 0;white-space:nowrap;color:var(--xr-font-color2);vertical-align:top"`;
  const row = (label, arr, chk = "") =>
    `<tr><td ${td0}>${label}</td><td ${td1}>${arr}</td><td ${td2}>${chk}</td></tr>`;
  return `<table style="border-collapse:collapse;padding:6px 0 12px"><tr>
    <td style="vertical-align:top;padding:0">
      <table style="font-size:12px;font-family:monospace;border-collapse:collapse;line-height:1.75">
        <thead><tr>
          <th style="font-weight:400;padding:0 16px 5px 0;text-align:left"></th>
          <th style="font-weight:600;padding:0 16px 5px 0;text-align:left">Array</th>
          <th style="font-weight:600;padding:0 0 5px 0;text-align:left">Chunk</th>
        </tr></thead><tbody>
          ${row("Bytes", fmtBytes(arrayBytes), chunkBytes !== null ? fmtBytes(chunkBytes) : "\u2014")}
          ${row("Shape", "(" + shape.join(", ") + ")", chunks ? "(" + chunks.join(", ") + ")" : "\u2014")}
          ${nChunks !== null ? row("Chunks", nChunks.toLocaleString() + " chunks") : ""}
          ${row("dtype", esc(dtype))}
          ${row("dims", "(" + dv.dims.join(", ") + ")")}
        </tbody>
      </table>
    </td>
    <td style="vertical-align:middle;padding:0 0 0 32px">${buildChunkCube(shape)}</td>
  </tr></table>`;
}

function summarizeVariable(name, dv, isIndex) {
  const aId = uid(),
    dId = uid();
  const hasAttrs = Object.keys(dv.attrs).length > 0;
  return `
    <div class='xr-var-name'><span${isIndex ? " class='xr-has-index'" : ""}>${esc(name)}</span></div>
    <div class='xr-var-dims'>(${dv.dims.map(esc).join(", ")})</div>
    <div class='xr-var-dtype'>${esc(dv.dtype)}</div>
    <div class='xr-var-preview xr-preview'>${esc(previewVar(dv))}</div>
    <input id='${aId}' class='xr-var-attrs-in' type='checkbox'${hasAttrs ? "" : " disabled"}>
    <label for='${aId}' title='Show/Hide attributes'>${icon("icon-file-text2")}</label>
    <input id='${dId}' class='xr-var-data-in' type='checkbox'>
    <label for='${dId}' title='Show/Hide data repr'>${icon("icon-database")}</label>
    <div class='xr-var-attrs'>${summarizeAttrs(dv.attrs)}</div>
    <div class='xr-var-data'>${buildDataRepr(dv)}</div>
  `;
}

function varListHtml(vars, indexedNames) {
  return `<ul class='xr-var-list'>${Object.entries(vars)
    .map(
      ([name, dv]) =>
        `<li class='xr-var-item'>${summarizeVariable(name, dv, indexedNames.has(name))}</li>`
    )
    .join("")}</ul>`;
}

function collapsibleSection(
  header,
  inline,
  details,
  nItems,
  enabled,
  collapsed
) {
  const id = uid();
  const hasItems = nItems > 0;
  const nSpan = nItems !== null ? ` <span>(${nItems})</span>` : "";
  const enabledA = enabled && hasItems ? "" : " disabled";
  const collapsedA = collapsed || !hasItems ? "" : " checked";
  const tip = enabledA === "" ? " title='Expand/collapse section'" : "";
  return `
    <input id='${id}' class='xr-section-summary-in' type='checkbox'${enabledA}${collapsedA} />
    <label for='${id}' class='xr-section-summary'${tip}>${header}${nSpan}</label>
    <div class='xr-section-inline-details'>${inline}</div>
    ${details ? `<div class='xr-section-details'>${details}</div>` : ""}
  `;
}

const XR_ICONS = `<svg style="position:absolute;width:0;height:0;overflow:hidden"><defs>
<symbol id="icon-database" viewBox="0 0 32 32">
  <path d="M16 0c-8.837 0-16 2.239-16 5v4c0 2.761 7.163 5 16 5s16-2.239 16-5v-4c0-2.761-7.163-5-16-5z"/>
  <path d="M16 17c-8.837 0-16-2.239-16-5v6c0 2.761 7.163 5 16 5s16-2.239 16-5v-6c0 2.761-7.163 5-16 5z"/>
  <path d="M16 26c-8.837 0-16-2.239-16-5v6c0 2.761 7.163 5 16 5s16-2.239 16-5v-6c0 2.761-7.163 5-16 5z"/>
</symbol>
<symbol id="icon-file-text2" viewBox="0 0 32 32">
  <path d="M28.681 7.159c-0.694-0.947-1.662-2.053-2.724-3.116s-2.169-2.030-3.116-2.724c-1.612-1.182-2.393-1.319-2.841-1.319h-15.5c-1.378 0-2.5 1.121-2.5 2.5v27c0 1.378 1.122 2.5 2.5 2.5h23c1.378 0 2.5-1.122 2.5-2.5v-19.5c0-0.448-0.137-1.23-1.319-2.841zM24.543 5.457c0.959 0.959 1.712 1.825 2.268 2.543h-4.811v-4.811c0.718 0.556 1.584 1.309 2.543 2.268zM28 29.5c0 0.271-0.229 0.5-0.5 0.5h-23c-0.271 0-0.5-0.229-0.5-0.5v-27c0-0.271 0.229-0.5 0.5-0.5 0 0 15.499-0 15.5 0v7c0 0.552 0.448 1 1 1h7v19.5z"/>
</symbol>
</defs></svg>`;

function renderDataset(ds) {
  const coordNames = new Set(Object.keys(ds.coords));
  const sections = [];
  sections.push(
    collapsibleSection(
      "Dimensions:",
      formatDims(ds.dims, coordNames),
      "",
      Object.keys(ds.dims).length,
      false,
      true
    )
  );
  if (Object.keys(ds.coords).length) {
    sections.push(
      collapsibleSection(
        "Coordinates:",
        "",
        varListHtml(ds.coords, coordNames),
        Object.keys(ds.coords).length,
        true,
        false
      )
    );
  }
  sections.push(
    collapsibleSection(
      "Data variables:",
      "",
      varListHtml(ds.data_vars, new Set()),
      Object.keys(ds.data_vars).length,
      true,
      false
    )
  );
  if (Object.keys(ds.attrs).length) {
    sections.push(
      collapsibleSection(
        "Attributes:",
        "",
        summarizeAttrs(ds.attrs),
        Object.keys(ds.attrs).length,
        true,
        true
      )
    );
  }
  const sectHtml = sections
    .map((s) => `<li class='xr-section-item'>${s}</li>`)
    .join("");
  return `<div class='xr-root'>
    <div class='xr-wrap'>
      <div class='xr-header'><div class='xr-obj-type'>xarray.Dataset</div></div>
      <ul class='xr-sections'>${sectHtml}</ul>
    </div>
  </div>`;
}

function buildXarrayRepr(result) {
  if (!result.groups) {
    return `${XR_ICONS}${renderDataset(result)}`;
  }
  const cards = Object.entries(result.groups)
    .map(
      ([name, ds]) => `
    <details open style="margin-bottom:10px;border:1px solid var(--xr-border-color);border-radius:4px;overflow:hidden">
      <summary style="padding:8px 12px;font-weight:600;cursor:pointer;background:var(--xr-background-color-row-odd);list-style:none;display:flex;align-items:center;gap:8px">
        <span style="font-size:11px;color:var(--xr-font-color2)">\u25b6</span>
        <span>Group: ${esc(name)}</span>
      </summary>
      <div style="padding:0 12px 8px">${renderDataset(ds)}</div>
    </details>
  `
    )
    .join("");
  return `${XR_ICONS}<div style="font-family:monospace">${cards}</div>`;
}

// Inject xarray CSS once (we chose light-themed colors to be
// compatible with freva's current light theme, but it should look
// decent in dark mode too)

const XR_CSS = `
:root {
  --xr-font-color0: var(--jp-content-font-color0, rgba(0,0,0,1));
  --xr-font-color2: var(--jp-content-font-color2, rgba(0,0,0,.54));
  --xr-font-color3: var(--jp-content-font-color3, rgba(0,0,0,.38));
  --xr-border-color: var(--jp-border-color2, #e0e0e0);
  --xr-disabled-color: var(--jp-layout-color3, #bdbdbd);
  --xr-background-color: var(--jp-layout-color0, white);
  --xr-background-color-row-even: var(--jp-layout-color1, white);
  --xr-background-color-row-odd: var(--jp-layout-color2, #eeeeee);
}
.xr-wrap{display:block!important;min-width:300px;max-width:700px;line-height:1.6;padding-bottom:4px}
.xr-header{padding-top:6px;padding-bottom:6px;border-bottom:solid 1px var(--xr-border-color);margin-bottom:4px}
.xr-header>div,.xr-header>ul{display:inline;margin-top:0;margin-bottom:0}
.xr-obj-type,.xr-obj-name{margin-left:2px;margin-right:10px}
.xr-obj-type{color:var(--xr-font-color2)}
.xr-sections{padding-left:0!important;display:grid;grid-template-columns:150px auto auto 1fr 0 20px 0 20px;margin-block-start:0;margin-block-end:0}
.xr-section-item{display:contents}
.xr-section-item>input,.xr-var-item>input{display:block;opacity:0;height:0;margin:0}
.xr-section-item>input+label,.xr-var-item>input+label{color:var(--xr-disabled-color)}
.xr-section-item>input:enabled+label,.xr-var-item>input:enabled+label{cursor:pointer;color:var(--xr-font-color2)}
.xr-section-item>input:enabled+label:hover,.xr-var-item>input:enabled+label:hover{color:var(--xr-font-color0)}
.xr-section-summary{grid-column:1;color:var(--xr-font-color2);font-weight:500;white-space:nowrap}
.xr-section-summary>span{display:inline-block;padding-left:.3em}
.xr-section-summary-in:disabled+label{color:var(--xr-font-color2)}
.xr-section-summary-in+label:before{display:inline-block;content:"►";font-size:11px;width:15px;text-align:center}
.xr-section-summary-in:disabled+label:before{color:var(--xr-disabled-color)}
.xr-section-summary-in:checked+label:before{content:"▼"}
.xr-section-summary-in:checked+label>span{display:none}
.xr-section-summary,.xr-section-inline-details{padding-top:4px}
.xr-section-inline-details{grid-column:2/-1}
.xr-section-details{grid-column:1/-1;margin-top:4px;margin-bottom:5px}
.xr-section-summary-in~.xr-section-details{display:none}
.xr-section-summary-in:checked~.xr-section-details{display:contents}
.xr-array-wrap{grid-column:1/-1;display:grid;grid-template-columns:20px auto}
.xr-array-wrap>label{grid-column:1;vertical-align:top}
.xr-preview{color:var(--xr-font-color3)}
.xr-array-preview,.xr-array-data{padding:0 5px!important;grid-column:2}
.xr-array-data,.xr-array-in:checked~.xr-array-preview{display:none}
.xr-array-in:checked~.xr-array-data,.xr-array-preview{display:inline-block}
.xr-dim-list{display:inline-block!important;list-style:none;padding:0!important;margin:0}
.xr-dim-list li{display:inline-block;padding:0;margin:0}
.xr-dim-list:before{content:"("}
.xr-dim-list:after{content:")"}
.xr-dim-list li:not(:last-child):after{content:",";padding-right:5px}
.xr-has-index{font-weight:bold}
.xr-var-list,.xr-var-item{display:contents}
.xr-var-item>div,.xr-var-item label,.xr-var-item>.xr-var-name span{background-color:var(--xr-background-color-row-even);border-color:var(--xr-background-color-row-odd);margin-bottom:0;padding-top:2px}
.xr-var-list>li:nth-child(odd)>div,.xr-var-list>li:nth-child(odd)>label,.xr-var-list>li:nth-child(odd)>.xr-var-name span{background-color:var(--xr-background-color-row-odd);border-color:var(--xr-background-color-row-even)}
.xr-var-name{grid-column:1}
.xr-var-dims{grid-column:2}
.xr-var-dtype{grid-column:3;text-align:right;color:var(--xr-font-color2)}
.xr-var-preview{grid-column:4}
.xr-index-preview{grid-column:2/5;color:var(--xr-font-color2)}
.xr-var-name,.xr-var-dims,.xr-var-dtype,.xr-preview,.xr-attrs dt{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:10px}
.xr-var-name:hover,.xr-var-dims:hover,.xr-var-dtype:hover,.xr-attrs dt:hover{overflow:visible;width:auto;z-index:1}
.xr-var-attrs,.xr-var-data,.xr-index-data{display:none;border-top:2px dotted var(--xr-background-color);padding-bottom:20px!important;padding-top:10px!important}
.xr-var-attrs-in:checked~.xr-var-attrs,.xr-var-data-in:checked~.xr-var-data{display:block}
.xr-var-data>table{float:right}
.xr-var-data>pre,.xr-var-data>table>tbody>tr{background-color:transparent!important}
.xr-var-name span,.xr-var-data,.xr-attrs{padding-left:25px!important}
.xr-attrs,.xr-var-attrs,.xr-var-data,.xr-index-data{grid-column:1/-1}
dl.xr-attrs{padding:0;margin:0;display:grid;grid-template-columns:125px auto}
.xr-attrs dt,.xr-attrs dd{padding:0;margin:0;float:left;padding-right:10px;width:auto}
.xr-attrs dt{font-weight:normal;grid-column:1}
.xr-attrs dd{grid-column:2;white-space:pre-wrap;word-break:break-all}
.xr-icon-database,.xr-icon-file-text2{display:inline-block;vertical-align:middle;width:1em;height:1.5em!important;stroke-width:0;stroke:currentColor;fill:currentColor}
.xr-var-attrs-in:checked+label>.xr-icon-file-text2,.xr-var-data-in:checked+label>.xr-icon-database{color:var(--xr-font-color0);filter:drop-shadow(1px 1px 5px var(--xr-font-color2));stroke-width:.8px}
.xr-var-item>input+label{cursor:pointer;color:var(--xr-font-color2);padding:0 1px}
`;

let cssInjected = false;
function injectXarrayCss() {
  if (cssInjected) {
    return;
  }
  cssInjected = true;

  const hex = (window.MAIN_COLOR || "#9b7a52").replace(/^#/, "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const cl = (f) =>
    `rgb(${Math.min(255, (r * f) | 0)},${Math.min(255, (g * f) | 0)},${Math.min(255, (b * f) | 0)})`;
  const ca = (f, a) =>
    `rgba(${Math.min(255, (r * f) | 0)},${Math.min(255, (g * f) | 0)},${Math.min(255, (b * f) | 0)},${a})`;

  const chunkVars = `
    :root{--xr-chunk-face:${cl(0.85)};--xr-chunk-top:${cl(1.25)};--xr-chunk-side:${cl(0.55)};--xr-chunk-edge:${cl(0.25)}}
    html[data-theme="dark"],body[data-theme="dark"],body.vscode-dark{
      --xr-chunk-face:${ca(0.85, 0.65)};--xr-chunk-top:${ca(1.25, 0.65)};--xr-chunk-side:${ca(0.55, 0.65)};--xr-chunk-edge:${ca(0.25, 0.4)}
    }
  `;

  const style = document.createElement("style");
  style.setAttribute("data-xarray-repr", "1");
  style.textContent = chunkVars + XR_CSS;
  document.head.appendChild(style);
}

// Hook to fetch (v2: .zmetadata, v3: zarr.json) and build an HTML representation
// of the dataset using xarray's style.
// it fires only after the zarr conversion job is done

export function useHtmlMetadata(rawZarrUrl, { enabled = false } = {}) {
  const [html, setHtml] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setHtml(null);
    setError(null);

    if (!rawZarrUrl || !enabled) {
      return () => {};
    }

    injectXarrayCss();

    let cancelled = false;

    (async () => {
      try {
        const ds = await openDatasetMeta(rawZarrUrl);
        if (!cancelled) {
          setHtml(buildXarrayRepr(ds));
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rawZarrUrl, enabled]);

  return { html, error };
}
