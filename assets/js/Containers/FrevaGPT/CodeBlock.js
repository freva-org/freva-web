import React from 'react';

import PropTypes from "prop-types";

const CodeBlockStyle = {
    block: {
        backgroundColor: "#444",
        borderRadius: "5px",
        borderTop: "20px solid #666",
        padding: "5px 5px 5px 15px",
        color: "lightgray",
        fontWeight: "bold",
        fontFamily: "Consolas",
        marginBottom: "10px"
    },
    blockLanguage: {
        backgroundColor: "lightgrey",
    },
    codeLine: {
        margin: "0px",
    }
}

function formatCode(codeString) {
    const seperatedCode = codeString.split("\\n");
    return seperatedCode;
}

function CodeBlock(props) {
    return(
        <div style={CodeBlockStyle.block}>
            {formatCode(props.code).map((element, index) => {return <p style={CodeBlockStyle.codeLine} key={index}>{element}</p>})}
        </div>
    );
}

CodeBlock.propTypes = {
    code: PropTypes.string,
}

export default CodeBlock;