import React from "react";
import PropTypes from "prop-types";
import { Toast } from "react-bootstrap";

export default function ClipboardToast({ show, setShow }) {
  return (
    <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 11 }}>
      <Toast
        onClose={() => setShow(false)}
        show={show}
        delay={3000}
        style={{ backgroundColor: "#ddede5" }}
        autohide
      >
        <Toast.Body>
          <strong id="clipboard-toast-text">Copied command to clipboard</strong>
        </Toast.Body>
      </Toast>
    </div>
  );
}

ClipboardToast.propTypes = {
  setShow: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
};
