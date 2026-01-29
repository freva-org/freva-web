import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { Toast } from "react-bootstrap";

import { setShowMessageToast } from "../../actions";

export default function MessageToast() {

  const showMessageToast = useSelector((state) => state.frevaGPTReducer.showMessageToast);
  const messageToastContent = useSelector((state) => state.frevaGPTReducer.messageToastContent);

  const dispatch = useDispatch();

  return (
    <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 11 }}>
      <Toast
        onClose={() => dispatch(setShowMessageToast(false))}
        show={showMessageToast}
        delay={3000}
        bg={messageToastContent.color}
        autohide
      >
        <Toast.Body>
          <strong id="clipboard-toast-text">{messageToastContent.message}</strong>
        </Toast.Body>
      </Toast>
    </div>
  );
}
