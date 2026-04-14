import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import hljs from "highlight.js";
import "highlight.js/styles/stackoverflow-light.css";

import { Col, Card, Spinner, Row, Button, Collapse } from "react-bootstrap";
import { FaAngleDown, FaAngleUp } from "react-icons/fa";

import * as constants from "../../constants";

import AssistantBlock from "./AssistantBlock";

function PendingAnswerComponent({ content, variant }) {
  const [plainCode, setPlainCode] = useState("");
  const [fancyCode, setFancyCode] = useState("");
  const [showCode, setShowCode] = useState(true);
  const lastVariant = useSelector((state) => state.frevaGPTReducer.lastVariant);

  useEffect(() => {
    extractCode(content);
  }, [content]);

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
      const lastLineBreak = code.lastIndexOf("\n");

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
        <Card className="bot-shadow br-8 card-body border-0 border-bottom mb-3 bg-light">
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
              <Card.Body className="p-0 m-0 bot-streaming-code">
                <pre className="fancy-code">
                  <code className="language-python">{fancyCode}</code>
                </pre>

                <p className="bot-streaming-code">{plainCode}</p>
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
          <Card className="bot-shadow br-8 card-body border-0 border-bottom mb-3 bg-light d-flex flex-row align-items-center">
            <Spinner size="sm" />
            <span className="ms-2">
              {lastVariant === "Code" ? "Executing..." : "Thinking..."}
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
          <Card className="bot-shadown br-8 card-body border-0 border-bottom mb-3 bg-light d-flex flex-row align-items-center">
            <Spinner size="sm" />
            <span className="ms-2">Plotting image...</span>
          </Card>
        </Col>
      </Row>
    );
  }

  function renderAnswer() {
    switch (variant) {
      case "Assistant":
        return (
          <AssistantBlock
            content={{ variant, content }}
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

  return renderAnswer();
}

PendingAnswerComponent.propTypes = {
  content: PropTypes.string,
  variant: PropTypes.string,
};

export default PendingAnswerComponent;
