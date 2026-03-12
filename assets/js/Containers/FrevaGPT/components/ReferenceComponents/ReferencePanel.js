import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { Card, Offcanvas } from "react-bootstrap";

import { setShowReferencePanel } from "../../actions";

function ReferencePanel() {
  const showReferencePanel = useSelector(
    (state) => state.frevaGPTReducer.showReferencePanel
  );
  const dispatch = useDispatch();

  function closeReferencePanel() {
    dispatch(setShowReferencePanel(false));
  }

  return (
    <Offcanvas
      show={showReferencePanel}
      onHide={closeReferencePanel}
      placement="end"
      scroll
    >
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>References</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <Card className="w-100 bot-shadow br-8">
          <Card.Body>hi</Card.Body>
        </Card>
      </Offcanvas.Body>
    </Offcanvas>
  );
}

export default ReferencePanel;
