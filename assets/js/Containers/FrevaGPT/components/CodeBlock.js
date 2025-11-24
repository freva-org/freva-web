import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Card, Collapse, Button, ButtonGroup } from "react-bootstrap";
import { FaAngleDown, FaAngleUp, FaRegCopy } from "react-icons/fa";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  materialDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";

import PropTypes from "prop-types";

import { toggleShowCode } from "../actions";

import ClipboardToast from "../../../Components/ClipboardToast";

import { formatCode } from "../utils";

function CodeBlock({ showCode, content }) {
  useEffect(() => {
    setLocalShowCode(showCode);
  }, [showCode]);

  const [localShowCode, setLocalShowCode] = useState();
  const [showToast, setShowToast] = useState(false);

  const dispatch = useDispatch();

  function localToggleShowCode() {
    setLocalShowCode(!localShowCode);
  }

  function extractElements(content, variant) {
    return content.filter((elem) => elem.variant === variant);
  }

  function copyCode() {
    const code = extractElements(content, "Code").map((codeElement) => {
      return formatCode("Code", codeElement.content[0]);
    });
    navigator.clipboard.writeText(code);
    setShowToast(true);
  }

  return (
    <>
      <Card className="shadow-sm card-body border-0 border-bottom mb-3 bg-light">
        <div className="d-flex justify-content-between">
          <Button
            variant="link"
            className="m-0 p-0 d-inline-flex text-decoration-none"
            onClick={() => {
              localToggleShowCode();
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
          <div>
            <p className="d-inline me-2">Always show details</p>
            <ButtonGroup size="sm" aria-label="Basic example">
              <Button
                variant={showCode ? "outline-secondary" : "secondary"}
                onClick={() => dispatch(toggleShowCode(showCode))}
              >
                Off
              </Button>
              <Button
                variant={showCode ? "success" : "outline-success"}
                onClick={() => dispatch(toggleShowCode(showCode))}
              >
                On
              </Button>
            </ButtonGroup>
          </div>
        </div>

        <Collapse in={localShowCode} className="mt-2">
          <Card className="shadow-sm">
            <Card.Header style={{ backgroundColor: "#eee" }}>
              <div className="d-flex justify-content-between align-items-center">
                python
                <Button variant="link" onClick={copyCode}>
                  <span>
                    <FaRegCopy className="color" />
                  </span>
                </Button>
              </div>
            </Card.Header>

            {extractElements(content, "Code").map((codeElement) => {
              return (
                <Card.Body
                  className="p-0 m-0 border-bottom"
                  key={`${codeElement.id}-code`}
                  style={{ backgroundColor: "#fafafa" }}
                >
                  <SyntaxHighlighter language="python" style={oneLight}>
                    {formatCode("Code", codeElement.content)}
                  </SyntaxHighlighter>
                </Card.Body>
              );
            })}

            {extractElements(content, "CodeOutput").map((codeElement) => {
              return (
                <Card.Footer
                  className="p-0 m-0"
                  key={`${codeElement.id}-codeoutput`}
                  style={{ backgroundColor: "#263238", fontSize: "0.72em" }}
                >
                  <SyntaxHighlighter language="python" style={materialDark}>
                    {formatCode("CodeOutput", codeElement.content)}
                  </SyntaxHighlighter>
                </Card.Footer>
              );
            })}
          </Card>
        </Collapse>
      </Card>
      <ClipboardToast show={showToast} setShow={setShowToast} />
    </>
  );
}

CodeBlock.propTypes = {
  content: PropTypes.array,
  showCode: PropTypes.bool,
};

export default CodeBlock;
