
function replaceLinebreaks(data) {
    const formattedData = data.split("\\n").join("\n")
    return formattedData;
}

export default {
    replaceLinebreaks,
};