import React, { useState, useRef } from "react";
import PropTypes from "prop-types";

import queryString from "query-string";

import { browserHistory } from "react-router";
import { isEmpty } from "lodash";

import { Modal, Button, FormControl } from "react-bootstrap";

import { fetchWithAuth } from "../../utils";

import MessageToast from "../Snippets/MessageToast";

function ThreadModal({
  mode,
  showModal,
  setShowModal,
  element,
  updateThreadList,
}) {
  const [newTopic, setNewTopic] = useState(element.topic);
  const [showToast, setShowToast] = useState(false);
  const toastColor = useRef("");
  const toastMessage = useRef("");

  function isCurrentThread(deleteThreadId) {
    const currentQueryParams = browserHistory.getCurrentLocation().query;

    if ("thread_id" in currentQueryParams) {
      const currentThreadId = currentQueryParams.thread_id;
      if (currentThreadId === deleteThreadId) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

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
        toastColor.current = "success";
        toastMessage.current = "Renamed chat.";
        updateThreadList(mode, newElement);
      } else {
        toastColor.current = "danger";
        toastMessage.current = "Could not rename chat!";
      }
    }
    setShowModal(false);
    setShowToast(true);
  }

  async function deleteThread() {
    const queryParameter = {
      thread_id: element.thread_id,
    };

    const response = await fetchWithAuth(
      `/api/chatbot/deletethread?` + queryString.stringify(queryParameter)
    );

    if (response.ok) {
      toastColor.current = "success";
      toastMessage.current = "Deleted chat.";
      updateThreadList(mode, element);

      //if current displayed thread is deleted navigate to start chatbot page
      if (isCurrentThread(element.thread_id)) {
        window.location.assign("/chatbot");
      }
    } else {
      toastColor.current = "danger";
      toastMessage.current = "Could not delete chat.";
    }
    setShowModal(false);
    setShowToast(true);
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
    <>
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
      <MessageToast
        show={showToast}
        setShow={setShowToast}
        color={toastColor.current}
        message={toastMessage.current}
      />
    </>
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
