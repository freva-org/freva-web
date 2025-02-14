import React, { useState, useEffect, forwardRef } from "react";
import PropTypes from "prop-types";

import { Col, Card, Spinner, Row } from "react-bootstrap";

import Markdown from "react-markdown";

import Highlight from "react-highlight";
import "highlight.js/styles/atom-one-light.css";

import * as constants from "../constants";

const PendingAnswerComponent = forwardRef((props, ref) => {
  const [renderedCode, setRenderedCode] = useState("");

  useEffect(() => {
    const parsedCode = renderCode(props.content);
    if (parsedCode !== "") {
      setRenderedCode(parsedCode);
    }
    
    if (props.position && props.content !== "") {
      ref.current?.scrollIntoView({behavior: 'smooth'});
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
              <p className="m-0">Analyzing...</p>
              <Card className="shadow-sm mt-2">
                <Card.Header>python</Card.Header>
                <Card.Body className="p-0 m-0">
                  <Highlight className="python">
                    {renderedCode}
                  </Highlight>
                  <span>
                    <Spinner size="sm" />
                  </span>
                </Card.Body>
              </Card>
            </Card>
          </Col>
        );
      case "ServerHint":
        return (
          <Row className="mb-3">
            <Col md={1}>
              <Spinner />
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
  position: PropTypes.bool,
};

export default PendingAnswerComponent;
