import React, { useState } from "react";

import { Col, FormControl, InputGroup, Button } from "react-bootstrap";

import { FaStop, FaPlay } from "react-icons/fa";

import { isEmpty } from "lodash";

import PropTypes from "prop-types";

import { resizeInputField } from "../utils";

function BotInput({ loading, handleSubmit, handleStop }) {
  const [userInput, setUserInput] = useState("");

  function handleUserInput(e) {
    setUserInput(e.target.value);
  }

  async function handleKeyDown(e) {
    const originalEvent = e.originalEvent || e.nativeEvent;
    if (
      (originalEvent.code === "Enter" ||
        originalEvent.code === "NumpadEnter") &&
      !originalEvent.shiftKey
    ) {
      e.preventDefault(); // preventing to add a new line within textare when sending request by pressing enter
      if (!loading) {
        if (!isEmpty(e.target.value.trim())) {
          handleSubmit(e.target.value);
          setUserInput("");
        }
      }
    }
  }

  async function submitUserInput() {
    if (!isEmpty(userInput.trim())) {
      await handleSubmit(userInput);
      setUserInput("");
    }
    setUserInput("");
  }

  return (
    <Col id="botInput">
      <InputGroup className="mb-2 pb-2">
        <FormControl
          as="textarea"
          id="inputField"
          rows={1}
          value={userInput}
          onChange={(e) => {
            handleUserInput(e);
            resizeInputField("inputField");
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question"
        />
        {loading ? (
          <Button
            variant="outline-danger"
            onClick={handleStop}
            className="d-flex align-items-center"
          >
            <FaStop />
          </Button>
        ) : (
          <Button
            variant="outline-success"
            onClick={submitUserInput}
            className="d-flex align-items-center"
          >
            <FaPlay />
          </Button>
        )}
      </InputGroup>
    </Col>
  );
}

BotInput.propTypes = {
  loading: PropTypes.bool,
  handleSubmit: PropTypes.func,
  handleStop: PropTypes.func,
};

export default BotInput;
