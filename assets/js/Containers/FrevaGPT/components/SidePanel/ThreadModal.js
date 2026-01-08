import React, { useState } from "react";
import PropTypes from "prop-types";

import { Modal, Button, FormControl } from "react-bootstrap";

function ThreadModal({ mode, showModal, setShowModal, element }) {
  const [newTopic, setNewTopic] = useState(element.topic);

  const modalOptions = {
    rename: {
      title: "Rename",
      body: (
        <FormControl
          as="textarea"
          value={newTopic}
          onChange={handleTopicInput}
          placeholder="Set a title"
        />
      ),
    },
    delete: {
      title: "Delete",
      body: "Are you sure you want to delete the conversation?",
    },
  };

  function handleTopicInput(e) {
    setNewTopic(e.target.value);
  }

  return (
    <Modal
      size="s"
      aria-labelledby="contained-modal-title-vcenter"
      centered
      show={showModal}
      onHide={() => {
        setShowModal(false);
      }}
    >
      <Modal.Header closeButton>{modalOptions[mode].title}</Modal.Header>

      <Modal.Body>{modalOptions[mode].body}</Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowModal(false)}>
          Cancel
        </Button>
        <Button variant="info">{modalOptions[mode].title}</Button>
      </Modal.Footer>
    </Modal>
  );
}

ThreadModal.propTypes = {
  mode: PropTypes.string,
  showModal: PropTypes.bool,
  setShowModal: PropTypes.func,
  element: PropTypes.object,
};

export default ThreadModal;
