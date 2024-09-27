
function replaceLinebreaks(data) {
    const formattedData = data.split("\\n").join("\n")
    return formattedData;
}

function formatCode(mode, data) {

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

const ADD_ELEMENT = () => (dispatch) => {

}

export default {
    replaceLinebreaks,
    formatCode,
};