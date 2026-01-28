import React from "react";
import PropTypes from "prop-types";
import { Toast } from "react-bootstrap";

export default function MessageToast({ show, setShow, color, message }) {
  return (
    <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 11 }}>
      <Toast
        onClose={() => setShow(false)}
        show={show}
        delay={3000}
        bg={color}
        autohide
      >
        <Toast.Body>
          <strong id="clipboard-toast-text">{message}</strong>
        </Toast.Body>
      </Toast>
    </div>
  );
}

MessageToast.propTypes = {
  setShow: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
  color: PropTypes.string,
  message: PropTypes.string,
};
