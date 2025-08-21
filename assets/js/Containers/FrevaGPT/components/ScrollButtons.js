import React from "react";

import { Col, Button } from "react-bootstrap";

import { FaArrowDown, FaArrowUp } from "react-icons/fa";

import { scrollToChatBottom } from "../utils";

function ScrollButtons() {
  // here also no suitable solutions using bootstrap found -> need for better solution
  const scrollButtonStyle = {
    zIndex: 10,
    right: "40px",
    bottom: "10px",
    position: "sticky",
  };

  return (
    <>
      <Col
        md={12}
        style={scrollButtonStyle}
        className="d-flex flex-row justify-content-end"
      >
        <div className="d-flex flex-column">
          <Button
            variant="secondary"
            className="mb-2"
            onClick={() =>
              document
                .getElementById("chatContainer")
                .scrollTo({ top: 0, behavior: "smooth" })
            }
          >
            <FaArrowUp />
          </Button>

          <Button variant="secondary" onClick={() => scrollToChatBottom()}>
            <FaArrowDown />
          </Button>
        </div>
      </Col>
    </>
  );
}

export default ScrollButtons;
