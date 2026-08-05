import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import hljs from "highlight.js";
import "highlight.js/styles/stackoverflow-light.css";

import { isEmpty } from "lodash";

import { Col, Card, Spinner, Row, Collapse } from "react-bootstrap";
import { FaAngleDown, FaAngleUp } from "react-icons/fa";

import AssistantBlock from "./AssistantBlock";

function PendingAnswerComponent({ content, variant }) {
  const [plainCode, setPlainCode] = useState("");
  const [fancyCode, setFancyCode] = useState("");
  const [showCode, setShowCode] = useState(true);
  const lastVariant = useSelector((state) => state.frevaGPTReducer.lastVariant);

  useEffect(() => {
    //reset code when empty content is provided
    // normally empty content is provided in between different
    // variants being streamed or when the stream has finished
    if (isEmpty(content)) {
      setFancyCode("");
      setPlainCode("");
    }
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
      <div className="br-8 mb-3">
        <div className="d-flex justify-content-between bc-code-header align-items-center">
          <div
            className={
              showCode
                ? "p-2 bc-code-body bc-code-header-tab"
                : "p-2 bc-code-body"
            }
            role="button"
            onClick={() => {
              setShowCode(!showCode);
            }}
          >
            Code {showCode ? <FaAngleUp /> : <FaAngleDown />}
          </div>
        </div>

        <Collapse in={showCode} className="bn">
          <div className="p-0 m-0 border-bottom">
            <div className="d-flex bc-code-body">
              <div className="bc-code-margin"></div>
              <div>
                <pre className="m-0 fancy-code w-100">
                  <code className="language-python">{fancyCode}</code>
                </pre>
                <div className="bot-streaming-code">{plainCode}</div>
                <span>
                  <Spinner className="mx-1" size="sm" />
                </span>
              </div>
            </div>
          </div>
        </Collapse>
      </div>
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
