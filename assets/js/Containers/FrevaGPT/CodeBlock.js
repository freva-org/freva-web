import React from 'react';
import { Accordion } from 'react-bootstrap';

import PropTypes from "prop-types";

function formatCode(codeString) {
    const seperatedCode = codeString.split("\\n");
    return seperatedCode;
}

function CodeBlock(props) {
    return(
        <div className="mb-3">
            <Accordion defaultActiveKey="0">
                <Accordion.Item eventKey="0">
                <Accordion.Header>Code</Accordion.Header>
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
    code: PropTypes.string,
}

export default CodeBlock;