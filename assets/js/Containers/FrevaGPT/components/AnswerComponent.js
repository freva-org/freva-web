import React from "react";
import PropTypes from "prop-types";

import { Col, Card, Spinner, Accordion, Row } from "react-bootstrap";

import Markdown from "react-markdown";

import Highlight from "react-highlight";
import "highlight.js/styles/atom-one-light.css";

function AnswerComponent(props) {

  function renderCode(rawCode) {
    let jsonCode = "";
    let codeSnippets = "";   

    if (!rawCode.endsWith('"}')) jsonCode = rawCode + '"}';
    else jsonCode = rawCode;

    try {
      const code = JSON.parse(jsonCode);
      codeSnippets = code.code;
    } catch(err) {
      // console.error(err);
    }
    return codeSnippets;
  }

  function renderAnswer(props) {
    switch (props.variant) {
      case "Assistant":
        return (
          <Col md={{ span: 10, offset: 0 }}>
            <Card className="shadow-sm card-body border-0 border-bottom mb-3 bg-light">
              <Markdown>{props.content}</Markdown>
            </Card>
          </Col>
        );
      case "Code":
      case "CodeBlock":
        return (
          <>
            <div className="mb-3">
              <Accordion defaultActiveKey="0">
                <Accordion.Item eventKey="0">
                  <Accordion.Header>{props.variant}</Accordion.Header>
                  <Accordion.Body>
                    <Highlight>{renderCode(props.content)}</Highlight>
                    <span>
                      <Spinner size="sm"/>
                      <span className="m-2">Analyzing...</span>
                    </span>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </div>
          </>
        );
      case "ServerHint":
        return (
          <Row className="mb-3">
            <Col md={1}>
              <Spinner/>
            </Col>
          </Row>
        );
      default:
        return null;
    }
  }

  return renderAnswer(props);
}

AnswerComponent.propTypes = {
  content: PropTypes.string,
  variant: PropTypes.string,
};

export default AnswerComponent;
