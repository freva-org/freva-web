import React, { useState, useEffect, forwardRef } from "react";
import PropTypes from "prop-types";
import hljs from "highlight.js";
import "highlight.js/styles/stackoverflow-light.css";

import { Col, Card, Spinner, Row, Button, Collapse } from "react-bootstrap";
import { FaAngleDown, FaAngleUp } from "react-icons/fa";

import * as constants from "../../constants";

import AssistantBlock from "./AssistantBlock";

const PendingAnswerComponent = forwardRef((props, ref) => {
  const [plainCode, setPlainCode] = useState("");
  const [fancyCode, setFancyCode] = useState("");
  const [showCode, setShowCode] = useState(true);

  useEffect(() => {
    extractCode(props.content);
  }, [props.content]);

  useEffect(() => {
    // hilight code blocks
    document.querySelectorAll(".fancy-code code").forEach((block) => {
      if (block.dataset.highlighted) {
        delete block.dataset.highlighted;
      }
      hljs.highlightElement(block);
    });
  }, [fancyCode]);

  function extractCode(rawCode) {
    let jsonCode = "";

    if (!rawCode.endsWith('"}')) {
      jsonCode = rawCode + '"}';
    } else {
      jsonCode = rawCode;
    }

    try {
      // dividing streamed code into blocks
      // only full blocks getting hilighted
      const code = JSON.parse(jsonCode).code;
      const lastLineBreak = code.lastIndexOf("\n\n");

      if (lastLineBreak !== -1) {
        setFancyCode(code.slice(0, lastLineBreak + 4));
        setPlainCode(code.slice(lastLineBreak));
      } else {
        setPlainCode(code);
      }
    } catch (err) {
      // console.error(err);
    }
  }

  function renderCode() {
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
            <span className="color">Analyzing...</span>
            <span>
              {showCode ? (
                <FaAngleUp className="color" />
              ) : (
                <FaAngleDown className="color" />
              )}
            </span>
          </Button>

          <Collapse in={showCode} className="mt-2">
            <Card className="shadow-sm mt-2">
              <Card.Header>python</Card.Header>
              <Card.Body
                className="p-0 m-0"
                style={{ backgroundColor: "#f6f6f6" }}
              >
                <pre className="fancy-code">
                  <code className="language-python">{fancyCode}</code>
                </pre>

                <p
                  style={{
                    color: "#2f3337",
                    fontSize: "14px",
                    padding: "1rem",
                  }}
                >
                  {plainCode}
                </p>
                <span>
                  <Spinner className="mx-1" size="sm" />
                </span>
              </Card.Body>
            </Card>
          </Collapse>
        </Card>
      </Col>
    );
  }

  function renderServerHint() {
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
  }

  function renderImage() {
    return (
      <Row className="mb-3">
        <Col md={3}>
          <Card className="shadow-sm card-body border-0 border-bottom mb-3 bg-light d-flex flex-row align-items-center">
            <Spinner size="sm" />
            <span className="ms-2">Plotting image...</span>
          </Card>
        </Col>
      </Row>
    );
  }

  function renderAnswer(props) {
    switch (props.variant) {
      case "Assistant":
        return (
          <AssistantBlock
            content={props}
            streaming
            key={`streaming-assistant`}
          />
        );
      case "Code":
        return renderCode();
      case "ServerHint":
        return renderServerHint();
      case "Image":
        return renderImage();
      default:
        return null;
    }
  }

  return renderAnswer(props);
});

PendingAnswerComponent.propTypes = {
  content: PropTypes.string,
  variant: PropTypes.string,
};

export default PendingAnswerComponent;
