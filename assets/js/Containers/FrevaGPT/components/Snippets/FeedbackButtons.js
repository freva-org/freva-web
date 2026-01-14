import React, { useState } from "react";
import { isEmpty } from "lodash";

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

  const thumbValues = {
    thumbsUp: {
      color: "green",
      size: 20,
      className: "me-1",
    },
    thumbsDown: {
      color: "red",
      size: 20,
    },
  };

  const ThumbsUpIcon = thumb === "up" ? FaThumbsUp : FaRegThumbsUp;
  const ThumbsDownIcon = thumb === "down" ? FaThumbsDown : FaRegThumbsDown;

  function handleFeedback(value) {
    if (!isEmpty(thumb) && thumb === value) {
      setThumb("");
    } else {
      setThumb(value);
    }
    // send feedback to backend
  }

  return (
    <Col md={11} className="d-flex justify-content-end mb-5">
      <IconContext.Provider value={thumbValues.thumbsUp}>
        <ThumbsUpIcon onClick={() => handleFeedback("up")} role="button" />
      </IconContext.Provider>
      <IconContext.Provider value={thumbValues.thumbsDown}>
        <ThumbsDownIcon onClick={() => handleFeedback("down")} role="button" />
      </IconContext.Provider>
    </Col>
  );
}
