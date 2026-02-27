import React, { useState } from "react";

import { Col, Card, Button, FormControl } from "react-bootstrap";

import { FaEdit } from "react-icons/fa";

import PropTypes from "prop-types";

import { resizeInputField, requestEditEndpoint } from "../../utils";

import { USER_INPUT_STYLE } from "../../constants";

function UserInputBlock({ content, onEdit }) {
  const [renderInput, setRenderInput] = useState(false);
  const [editedInput, setEditedInput] = useState("");

  function handleEdit(e) {
    setEditedInput(e.target.value);
  }

  async function startEditedChat(input, index) {
    onEdit(input, await requestEditEndpoint(index));
  }

  function renderInputComponent() {
    return (
      <>
        <FormControl
          as="textarea"
          id={`UserInputField-${content.original_index}`}
          className="mb-2"
          defaultValue={content.content}
          onChange={(e) => {
            handleEdit(e);
            resizeInputField(`UserInputField-${content.original_index}`);
          }}
        />

        <div className="w-100 d-flex justify-content-end">
          <Button
            variant="secondary"
            className="me-1"
            onClick={() => {
              setRenderInput(false);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="info"
            onClick={() => {
              startEditedChat(editedInput, content.original_index);
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
    <Col md={USER_INPUT_STYLE} key={`${content.original_index}-user`}>
      <Card className="bot-shadow br-8 card-body border-0 border-bottom bot-bg-lg">
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
          className="mt-2"
          color="grey"
        />
      </div>
    </Col>
  );
}

UserInputBlock.propTypes = {
  content: PropTypes.object,
  onEdit: PropTypes.func,
};

export default UserInputBlock;
