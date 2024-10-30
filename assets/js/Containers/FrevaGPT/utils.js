
export function replaceLinebreaks(data) {
    const formattedData = data.split("\\n").join("\n")
    return formattedData;
}

export function formatCode(mode, data) {

    // replace first linebreak in code got from old thread
    if (data.startsWith("\\n")) data = data.replace("\\n", "");

    let codeSnippets;
    let rawCode;

    try {
        if (mode === "Code") rawCode = JSON.parse(data).code;
        else if (mode === "CodeOutput") rawCode = data;
        codeSnippets = rawCode.split("\\n");
    } catch(err) {
        // do something
    }

    return codeSnippets;
}

export const objectToQueryString = (obj) => {
    return Object.entries(obj)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
  };

export const truncate = (value) => {
    var trunc = value.substr(0, 32) + "\u2026";
    return trunc;
}