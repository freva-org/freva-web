import React from "react";

import { Col, Button } from "react-bootstrap";

import { FaArrowDown, FaArrowUp } from "react-icons/fa";

import { scrollToChatBottom } from "../../utils";

function ScrollButtons() {
  return (
    <>
      <Col
        md={12}
        className="d-flex flex-row justify-content-end scroll-button"
      >
        <div className="d-flex flex-column">
          <Button
            variant="secondary"
            className="mb-2 bot-shadow br-8"
            onClick={() =>
              document
                .getElementById("chatContainer")
                .scrollTo({ top: 0, behavior: "smooth" })
            }
          >
            <FaArrowUp />
          </Button>

          <Button
            variant="secondary"
            onClick={() => scrollToChatBottom()}
            className="bot-shadow br-8"
          >
            <FaArrowDown />
          </Button>
        </div>
      </Col>
    </>
  );
}

export default ScrollButtons;
