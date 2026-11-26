import React from "react";

import { Toast, ToastContainer, ProgressBar } from "react-bootstrap";

import { FaInfoCircle } from "react-icons/fa";

import PropTypes from "prop-types";

function ExecutionToast({ details }) {
  const percentage =
    Math.round(
      ((details.progress.current * 100) / details.progress.total) * 100
    ) / 100;

  return (
    <>
      {details.status ? (
        <div
          aria-live="polite"
          aria-atomic="true"
          className="position-relative"
        >
          <ToastContainer
            className="p-3"
            position="bottom-center"
            style={{ zIndex: 1 }}
          >
            <Toast className="bot-shadow br-8">
              <Toast.Body>
                <div className="d-flex align-items-center">
                  <FaInfoCircle color="grey" size="20" className="me-2" />
                  <div>{details.message}</div>
                </div>
                <ProgressBar
                  now={percentage}
                  label={`${percentage}%`}
                  variant="success"
                  animated
                />
              </Toast.Body>
            </Toast>
          </ToastContainer>
        </div>
      ) : null}
    </>
  );
}

ExecutionToast.propTypes = {
  details: PropTypes.object,
};

export default ExecutionToast;
