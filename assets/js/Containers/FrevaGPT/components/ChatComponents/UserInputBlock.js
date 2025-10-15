import React, { useState } from "react";

import { Col, Card, Button, FormControl } from "react-bootstrap";

import { FaEdit } from "react-icons/fa";

import PropTypes from "prop-types";

import { resizeInputField } from "../../utils";

import { USER_INPUT_STYLE } from "../../constants";

function UserInputBlock({ content, index, onSend }) {
  const [showEditBar, setShowEditBar] = useState(false);
  const [renderInput, setRenderInput] = useState(false);
  const [editedInput, setEditedInput] = useState("");

  function handleEdit(e) {
    setEditedInput(e.target.value);
  }

  function renderInputComponent() {
    return (
      <>
        <FormControl
          as="textarea"
          id={`UserInputField-${index}`}
          className="mb-2"
          defaultValue={content.content}
          onChange={(e) => {
            handleEdit(e);
            resizeInputField(`UserInputField-${index}`);
          }}
        />
        <div className="w-100 d-flex justify-content-end">
          <Button
            variant="secondary"
            className="me-1"
            onClick={() => {
              setRenderInput(false);
              setShowEditBar(false);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="info"
            onClick={() => {
              onSend(editedInput, index);
              setRenderInput(false);
            }}
          >
            Send
          </Button>
        </div>
      </>
    );
  }

  return (
    <Col
      md={USER_INPUT_STYLE}
      key={`${index}-user`}
      onMouseEnter={() => setShowEditBar(true)}
      onMouseLeave={() => setShowEditBar(false)}
    >
      <Card
        className="shadow-sm card-body border-0 border-bottom"
        style={{ backgroundColor: "#eee" }}
      >
        {renderInput
          ? renderInputComponent()
          : editedInput
            ? editedInput
            : content.content}
      </Card>

      <div className="w-100 d-flex justify-content-end p-0 h-5">
        <FaEdit
          onClick={() => setRenderInput(true)}
          role="button"
          className={showEditBar ? "color mt-2" : "color mt-2 opacity-0"}
        />
      </div>
    </Col>
  );
}

UserInputBlock.propTypes = {
  content: PropTypes.object,
  index: PropTypes.number,
  onSend: PropTypes.func,
};

export default UserInputBlock;
