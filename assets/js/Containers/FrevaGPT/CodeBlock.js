import React from 'react';
import { Accordion } from 'react-bootstrap';

import PropTypes from "prop-types";

function formatCode(codeString) {
    // remove everyting before json codeblock
    let newString = codeString[0].slice(codeString[0].indexOf(":") + 2);
    newString = newString.slice(0, -2);

    const codeSnippets = newString.split("\\n");

    return codeSnippets;
}

function CodeBlock(props) {
    return(
        <div className="mb-3">
            <Accordion defaultActiveKey="0">
                <Accordion.Item eventKey="0">
                <Accordion.Header>{props.title}</Accordion.Header>
                    <Accordion.Body>
                        {formatCode(props.code).map((element, index) => {
                            return (<span key={index}>{element}<br></br></span>);
                            }
                        )}
                    </Accordion.Body>
                </Accordion.Item>
            </Accordion>
        </div>
    );
}

CodeBlock.propTypes = {
    code: PropTypes.array,
    title: PropTypes.string,
}

export default CodeBlock;