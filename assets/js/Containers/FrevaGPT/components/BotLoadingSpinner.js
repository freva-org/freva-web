import React, { forwardRef } from "react";

import { Card, Row, Col, Spinner } from "react-bootstrap";

import PropTypes from "prop-types";

const BotLoadingSpinner = forwardRef(({ dynamicAnswer, loading }, ref) => {
  return (
    <>
      {loading && !dynamicAnswer ? (
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
      ) : null}
    </>
  );
});

BotLoadingSpinner.propTypes = {
  dynamicAnswer: PropTypes.string,
  loading: PropTypes.bool,
};

export default BotLoadingSpinner;
