import React, { useState, useEffect } from "react";
import { Card, Collapse, Button } from "react-bootstrap";
import { FaAngleDown, FaAngleUp } from "react-icons/fa";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  materialDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";

import PropTypes from "prop-types";

import { formatCode } from "../utils";

function CodeBlock({ showCode, content }) {
  useEffect(() => {
    setLocalShowCode(showCode);
  }, [showCode]);

  const [localShowCode, setLocalShowCode] = useState();

  function toggleShowCode() {
    setLocalShowCode(!localShowCode);
  }

  function extractElements(content, variant) {
    return content.filter((elem) => elem.variant === variant);
  }

  return (
    <Card className="shadow-sm card-body border-0 border-bottom mb-3 bg-light">
      <Button
        variant="link"
        className="m-0 p-0 d-inline-flex text-decoration-none"
        onClick={() => {
          toggleShowCode();
        }}
      >
        <span style={{ fontWeight: "bold" }} className="color">
          Analyzed
        </span>
        <span>
          {localShowCode ? (
            <FaAngleUp className="color" />
          ) : (
            <FaAngleDown className="color" />
          )}
        </span>
      </Button>

      <Collapse in={localShowCode} className="mt-2">
        <Card className="shadow-sm">
          <Card.Header style={{ backgroundColor: "#eee" }}>python</Card.Header>

          {extractElements(content, "Code").map((codeElement) => {
            return (
              <Card.Body
                className="p-0 m-0 border-bottom"
                key={`${codeElement.content[1]}-code`}
                style={{ backgroundColor: "#fafafa" }}
              >
                <SyntaxHighlighter language="python" style={oneLight}>
                  {formatCode("Code", codeElement.content[0])}
                </SyntaxHighlighter>
              </Card.Body>
            );
          })}

          {extractElements(content, "CodeOutput").map((codeElement) => {
            return (
              <Card.Footer
                className="p-0 m-0"
                key={`${codeElement.content[1]}-codeoutput`}
                style={{ backgroundColor: "#263238", fontSize: "0.72em" }}
              >
                <SyntaxHighlighter language="python" style={materialDark}>
                  {formatCode("CodeOutput", codeElement.content[0])}
                </SyntaxHighlighter>
              </Card.Footer>
            );
          })}
        </Card>
      </Collapse>
    </Card>
  );
}

CodeBlock.propTypes = {
  showCode: PropTypes.bool,
  content: PropTypes.array,
};

export default CodeBlock;
