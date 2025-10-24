import React, { useState } from "react";

import { Col } from "react-bootstrap";
import { IconContext } from "react-icons";
import {
  FaRegThumbsUp,
  FaRegThumbsDown,
  FaThumbsDown,
  FaThumbsUp,
} from "react-icons/fa";

export default function FeedbackButtons() {
  const [thumb, setThumb] = useState();

  const thumbsUp = {
    color: "green",
    size: 20,
    className: "me-1",
  };

  const thumbsDown = {
    color: "red",
    size: 20,
  };

  function handleThumb(value) {
    setThumb(value);
    // send feedback to backend
  }

  return (
    <Col md={11} className="d-flex justify-content-end mb-5">
      <IconContext.Provider value={thumbsUp}>
        {thumb === "up" ? (
          <FaThumbsUp />
        ) : (
          <FaRegThumbsUp onClick={() => handleThumb("up")} role="button" />
        )}
      </IconContext.Provider>
      <IconContext.Provider value={thumbsDown}>
        {thumb === "down" ? (
          <FaThumbsDown />
        ) : (
          <FaRegThumbsDown onClick={() => handleThumb("down")} role="button" />
        )}
      </IconContext.Provider>
    </Col>
  );
}
