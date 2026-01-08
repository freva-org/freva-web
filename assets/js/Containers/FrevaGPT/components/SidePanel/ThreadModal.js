import React, { useState } from "react";
import PropTypes from "prop-types";

import queryString from "query-string";

import { isEmpty } from "lodash";

import { Modal, Button, FormControl } from "react-bootstrap";

import { fetchWithAuth } from "../../utils";

function ThreadModal({
  mode,
  showModal,
  setShowModal,
  element,
  updateThreadList,
}) {
  const [newTopic, setNewTopic] = useState(element.topic);

  async function renameThread() {
    if (!isEmpty(newTopic) && newTopic !== element.topic) {
      const queryParameter = {
        thread_id: element.thread_id,
        topic: newTopic,
      };

      const response = await fetchWithAuth(
        `/api/chatbot/setthreadtopic?` + queryString.stringify(queryParameter)
      );

      if (response.ok) {
        const newElement = {
          thread_id: element.thread_id,
          topic: newTopic,
        };

        updateThreadList(mode, newElement);
      } else {
        // todo: handle fail
      }
    }
    setShowModal(false);
  }

  async function deleteThread() {
    const queryParameter = {
      thread_id: element.thread_id,
    };

    const response = await fetchWithAuth(
      `/api/chatbot/deletethread?` + queryString.stringify(queryParameter)
    );

    if (response.ok) {
      updateThreadList(mode, element);
    } else {
      // todo: handle fail
    }
    setShowModal(false);
  }

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
      handler: renameThread,
    },
    delete: {
      title: "Delete",
      body: "Are you sure you want to delete the conversation?",
      handler: deleteThread,
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
        <Button
          variant="info"
          onClick={() => {
            modalOptions[mode].handler();
          }}
        >
          {modalOptions[mode].title}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

ThreadModal.propTypes = {
  mode: PropTypes.string,
  showModal: PropTypes.bool,
  setShowModal: PropTypes.func,
  element: PropTypes.object,
  updateThreadList: PropTypes.func,
};

export default ThreadModal;
