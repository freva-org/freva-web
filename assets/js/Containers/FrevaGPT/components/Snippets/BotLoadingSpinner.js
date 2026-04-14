import React from "react";
import { useSelector } from "react-redux";

import { Card, Row, Col, Spinner } from "react-bootstrap";

import PropTypes from "prop-types";

function BotLoadingSpinner({ dynamicAnswer, loading }) {
  const lastVariant = useSelector((state) => state.frevaGPTReducer.lastVariant);

  function loadingMessage() {
    switch (lastVariant) {
      case "Code":
        return "Executing...";
      case "ToolCall":
        return "Searching Docs...";
      default:
        return "Thinking...";
    }
  }

  return (
    <>
      {loading && !dynamicAnswer ? (
        <Row className="mb-3">
          <Col md={3}>
            <Card className="bot-shadow br-8 card-body border-0 border-bottom mb-3 bg-light d-flex flex-row align-items-center">
              <Spinner size="sm" />
              <span className="ms-2">{loadingMessage()}</span>
            </Card>
          </Col>
        </Row>
      ) : null}
    </>
  );
}

BotLoadingSpinner.propTypes = {
  dynamicAnswer: PropTypes.string,
  loading: PropTypes.bool,
};

export default BotLoadingSpinner;
