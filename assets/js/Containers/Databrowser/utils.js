import queryString from "query-string";

import * as constants from "./constants";

export function prepareSearchParams(location, additionalParams = "") {
  let params = "";
  let flavourValue =
    window.EFFECTIVE_DEFAULT_FLAVOUR || constants.DEFAULT_FLAVOUR;

  if (location) {
    const queryObject = location.query;
    const {
      dateSelector,
      minDate,
      maxDate,
      bboxSelector,
      minLon,
      maxLon,
      minLat,
      maxLat,
      flavour,
      ...facets
    } = queryObject;

    flavourValue = flavour ?? flavourValue;
    params = queryString.stringify(facets);

    if (params && additionalParams) {
      params = "&" + params;
    }

    const isDateSelected = !!minDate;
    if (isDateSelected) {
      params += `&time_select=${dateSelector}&time=${minDate} TO ${maxDate}`;
    }

    const isBBoxSelected = !!(minLon && maxLon && minLat && maxLat);
    if (isBBoxSelected) {
      params += `&bbox_select=${bboxSelector}&bbox=${minLon},${maxLon},${minLat},${maxLat}`;
    }
  }

  return `${flavourValue}/file?${additionalParams}${params}`;
}

export async function verifyAndSetDefaultFlavour() {
  // In this function to ensure that the flavour, exists on the backend
  // first we query the available flavours from the backend
  // then we check if window.DEFAULT_FLAVOUR is in the list
  // if yes, we set window.EFFECTIVE_DEFAULT_FLAVOUR to it
  try {
    const resp = await fetch("/api/freva-nextgen/databrowser/flavours", {
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!resp.ok) {
      window.EFFECTIVE_DEFAULT_FLAVOUR = window.DEFAULT_FLAVOUR || "freva";
      return window.EFFECTIVE_DEFAULT_FLAVOUR;
    }

    const json = await resp.json();
    const flavourDetails = json.flavours || [];
    const flavourNames = flavourDetails.map((f) => f.flavour_name);

    const preferred = window.DEFAULT_FLAVOUR;
    if (preferred && flavourNames.includes(preferred)) {
      window.EFFECTIVE_DEFAULT_FLAVOUR = preferred;
    } else if (flavourNames.length > 0) {
      window.EFFECTIVE_DEFAULT_FLAVOUR = flavourNames[0];
    } else {
      window.EFFECTIVE_DEFAULT_FLAVOUR = window.DEFAULT_FLAVOUR || "freva";
    }

    return window.EFFECTIVE_DEFAULT_FLAVOUR;
  } catch (err) {
    window.EFFECTIVE_DEFAULT_FLAVOUR = window.DEFAULT_FLAVOUR || "freva";
    return window.EFFECTIVE_DEFAULT_FLAVOUR;
  }
}
