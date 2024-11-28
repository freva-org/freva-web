import React from "react";
import PropTypes from "prop-types";

import { Col, Card } from "react-bootstrap";

function AnswerComponent(props) {
  function renderAnswer(props) {
    switch (props.variant) {
      case "Assistant":
      case "Code":
      case "CodeBlock":
        return (
          <Col md={{ span: 10, offset: 0 }}>
            <Card className="shadow-sm card-body border-0 border-bottom mb-3 bg-light">
              {props.content}
            </Card>
          </Col>
        );
      default:
        return null;
    }
  }

  return <div className="mb-3">{renderAnswer(props)}</div>;
}

AnswerComponent.propTypes = {
  content: PropTypes.string,
  variant: PropTypes.string,
};

export default AnswerComponent;
