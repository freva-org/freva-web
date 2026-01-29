import React, { useState, useRef } from "react";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";

import queryString from "query-string";

import { Col } from "react-bootstrap";

import { IconContext } from "react-icons";

import {
  FaRegThumbsUp,
  FaRegThumbsDown,
  FaThumbsDown,
  FaThumbsUp,
} from "react-icons/fa";

import { fetchWithAuth } from "../../utils";

function FeedbackButtons({ elementIndex, givenValue }) {
  const [thumb, setThumb] = useState(givenValue);
  const thumbRef = useRef(givenValue);
  const thread = useSelector((state) => state.frevaGPTReducer.thread);

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

  async function handleFeedback(value) {
    if (thumbRef.current !== value) {
      thumbRef.current = value;
      setThumb(value);
    } else {
      thumbRef.current = "remove";
      setThumb("");
    }

    const queryObject = {
      thread_id: thread,
      feedback_at_index: elementIndex,
      feedback: thumbRef.current,
    };

    await fetchWithAuth(
      `/api/chatbot/userfeedback?` + queryString.stringify(queryObject)
    );
  }

  return (
    <Col className="d-flex justify-content-end">
      <IconContext.Provider value={thumbValues.thumbsUp}>
        <ThumbsUpIcon onClick={() => handleFeedback("up")} role="button" />
      </IconContext.Provider>
      <IconContext.Provider value={thumbValues.thumbsDown}>
        <ThumbsDownIcon onClick={() => handleFeedback("down")} role="button" />
      </IconContext.Provider>
    </Col>
  );
}

FeedbackButtons.propTypes = {
  elementIndex: PropTypes.number,
  givenValue: PropTypes.string,
};

export default FeedbackButtons;
