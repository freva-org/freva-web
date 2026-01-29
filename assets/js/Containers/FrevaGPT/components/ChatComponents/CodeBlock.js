import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Card, Collapse, Button } from "react-bootstrap";
import { FaAngleDown, FaAngleUp, FaRegCopy } from "react-icons/fa";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  materialDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";

import PropTypes from "prop-types";

import { formatCode, setGivenFeedbackValue } from "../../utils";

import FeedbackButtons from "../Snippets/FeedbackButtons";
import { setMessageToastContent, setShowMessageToast } from "../../actions";

function CodeBlock({ showCode, content, elementIndex }) {
  useEffect(() => {
    setLocalShowCode(showCode);
  }, [showCode]);

  const [localShowCode, setLocalShowCode] = useState();

  const dispatch = useDispatch();

  function localToggleShowCode() {
    setLocalShowCode(!localShowCode);
  }

  function extractElements(content, variant) {
    return content.filter((elem) => elem.variant === variant);
  }

  function copyCode() {
    const code = extractElements(content, "Code").map((codeElement) => {
      return formatCode("Code", codeElement.content);
    });
    navigator.clipboard.writeText(code);
    dispatch(
      setMessageToastContent({
        color: "success",
        message: "Code copied to clipboard!",
      })
    );
    dispatch(setShowMessageToast(true));
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
          <FeedbackButtons
            elementIndex={elementIndex}
            givenValue={setGivenFeedbackValue(
              extractElements(content, "Code")[0]
            )}
          />
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
    </>
  );
}

CodeBlock.propTypes = {
  content: PropTypes.array,
  showCode: PropTypes.bool,
  elementIndex: PropTypes.number,
};

export default CodeBlock;
