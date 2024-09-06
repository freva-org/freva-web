import React from 'react';
import { Card } from 'react-bootstrap';

import PropTypes from "prop-types";

function formatCode(codeString) {
    const seperatedCode = codeString.split("\\n");
    return seperatedCode;
}

function CodeBlock(props) {
    return(
        <div className="mb-3">
            <Card text="white" className="shadow-sm border-0 border-bottom mb-3 bg-secondary">
                <Card.Header>Code</Card.Header>
                <Card.Body>
                    {formatCode(props.code).map((element, index) => {
                        return (<span key={index}>{element}<br></br></span>);
                        }
                    )}
                </Card.Body>
            </Card>
        </div>
    );
}

CodeBlock.propTypes = {
    code: PropTypes.string,
}

export default CodeBlock;