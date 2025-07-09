import React, { useState, useEffect, forwardRef } from "react";
import PropTypes from "prop-types";

import { Col, Card, Spinner, Row, Button, Collapse } from "react-bootstrap";
import { FaAngleDown, FaAngleUp } from "react-icons/fa";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

import Markdown from "react-markdown";

import * as constants from "../constants";
import { chatExceedsWindow, scrollToChatBottom } from "../utils";

const PendingAnswerComponent = forwardRef((props, ref) => {
  const [renderedCode, setRenderedCode] = useState("");
  const [showCode, setShowCode] = useState(false)

  useEffect(() => {
    const parsedCode = renderCode(props.content);
    if (parsedCode !== "") {
      setRenderedCode(parsedCode);
    }

    // conditional autoscrolling (might need some debounce for performance)
    if (props.content !== "" && chatExceedsWindow()) {
      if (props.atBottom) {
        scrollToChatBottom();
      }
    }
  }, [props.content]);

  function renderCode(rawCode) {
    let jsonCode = "";
    let codeSnippets = "";

    if (!rawCode.endsWith('"}')) {
      jsonCode = rawCode + '"}';
    } else {
      jsonCode = rawCode;
    }

    try {
      const code = JSON.parse(jsonCode);
      codeSnippets = code.code;
    } catch (err) {
      // console.error(err);
    }
    return codeSnippets;
  }

  function renderAnswer(props) {
    switch (props.variant) {
      case "Assistant":
        return (
          <Col md={constants.BOT_COLUMN_STYLE}>
            <Card className="shadow-sm card-body border-0 border-bottom mb-3 bg-light">
              <Markdown>{props.content}</Markdown>
            </Card>
          </Col>
        );
      case "Code":
        return (
          <Col md={constants.BOT_COLUMN_STYLE}>
            <Card className="shadow-sm card-body border-0 border-bottom mb-3 bg-light">
              
              <Button
                variant="link"
                className="m-0 p-0 d-inline-flex text-decoration-none"
                onClick={() => {
                  setShowCode(!showCode);
                }}
              >
                <span style={{ fontWeight: "bold", color: "#aa007d" }}>
                  Analyzing...
                </span>
                <span>
                  {showCode ? (
                    <FaAngleUp style={{ color: "#aa007d" }} />
                  ) : (
                    <FaAngleDown style={{ color: "#aa007d" }} />
                  )}
                </span>
              </Button>


              <Collapse in={showCode} className="mt-2">
                <Card className="shadow-sm mt-2">
                  <Card.Header>python</Card.Header>
                  <Card.Body
                    className="p-0 m-0"
                    style={{ backgroundColor: "#fafafa" }}
                  >
                    <SyntaxHighlighter language="python" style={oneLight}>
                      {renderedCode}
                    </SyntaxHighlighter>
                    <span>
                      <Spinner className="mx-1" size="sm" />
                    </span>
                  </Card.Body>
                </Card>
              </Collapse>
            </Card>
          </Col>
        );
      case "ServerHint":
        return (
          <Row className="mb-3">
            <Col md={3}>
              <Card className="shadow-sm card-body border-0 border-bottom mb-3 bg-light d-flex flex-row align-items-center">
                <Spinner size="sm" />
                <span className="ms-2">
                  {ref.lastVariant.current === "Code"
                    ? "Executing..."
                    : "Thinking..."}
                </span>
              </Card>
            </Col>
          </Row>
        );
      default:
        return null;
    }
  }

  return renderAnswer(props);
});

PendingAnswerComponent.propTypes = {
  content: PropTypes.string,
  variant: PropTypes.string,
  atBottom: PropTypes.bool,
};

export default PendingAnswerComponent;
