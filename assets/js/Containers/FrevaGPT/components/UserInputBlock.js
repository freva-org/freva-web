import React, { useState } from "react";

import { Col, Card, Button, FormControl } from "react-bootstrap";

import { FaEdit } from "react-icons/fa";

import PropTypes from "prop-types";

import { resizeInputField } from "../utils";

function UserInputBlock({ content, index, onSend }) {
  const [showEditBar, setShowEditBar] = useState(false);
  const [renderInput, setRenderInput] = useState(false);
  const [editedInput, setEditedInput] = useState("");

  function handleEdit(e) {
    setEditedInput(e.target.value);
  }

  function renderUserInputCard() {
    return (
      <Col
        md={{ span: 10, offset: 2 }}
        key={`${index}-user`}
        onMouseEnter={() => setShowEditBar(true)}
        onMouseLeave={() => setShowEditBar(false)}
      >
        <Card
          className="shadow-sm card-body border-0 border-bottom"
          style={{ backgroundColor: "#eee" }}
        >
          {editedInput ? editedInput : content.content}
        </Card>
        <div className="w-100 d-flex justify-content-end p-0 h-5">
          <Button
            variant="link"
            className="d-flex align-items-center"
            onClick={() => setRenderInput(true)}
          >
            {showEditBar ? <FaEdit /> : <FaEdit className="opacity-0" />}
          </Button>
        </div>
      </Col>
    );
  }

  function renderUserInputField() {
    return (
      <Col
        md={{ span: 10, offset: 2 }}
        key={`${index}-user`}
        onMouseEnter={() => setShowEditBar(true)}
        onMouseLeave={() => setShowEditBar(false)}
      >
        <Card
          className="shadow-sm card-body border-0 border-bottom"
          style={{ backgroundColor: "#eee" }}
        >
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
        </Card>
        <div className="w-100 d-flex justify-content-end p-0">
          <Button
            variant="link"
            className="d-flex align-items-center"
            onClick={() => setRenderInput(true)}
          >
            <FaEdit className="opacity-0" />
          </Button>
        </div>
      </Col>
    );
  }

  return <>{renderInput ? renderUserInputField() : renderUserInputCard()}</>;
}

UserInputBlock.propTypes = {
  content: PropTypes.object,
  index: PropTypes.number,
  onSend: PropTypes.func,
};

export default UserInputBlock;
