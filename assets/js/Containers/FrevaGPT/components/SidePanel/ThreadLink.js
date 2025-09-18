import React, { useState } from "react";
import PropTypes from "prop-types";

import { browserHistory } from "react-router";

import { isEmpty } from "lodash";

import queryString from "query-string";

import {
  OverlayTrigger,
  Tooltip,
  Badge,
  Modal,
  Button,
  FormControl,
} from "react-bootstrap";

import { FaPen } from "react-icons/fa";

import { fetchWithAuth } from "../../utils";

function ThreadLink({ element, onChangeName }) {
  const [showOptions, setShowOptions] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [topic, setTopic] = useState(element.topic);

  function changeToThread(thread) {
    browserHistory.push({
      pathname: "/chatbot/",
      search: `?thread_id=${thread}`,
    });
  }

  function handleTopicInput(e) {
    setTopic(e.target.value);
  }

  async function renameThread() {
    // TODO: add backend call to change topic of thread
    if (!isEmpty(topic) && topic !== element.topic) {
      const queryParameter = {
        thread_id: element.thread_id,
        topic,
      };

      const response = await fetchWithAuth(
        `/api/chatbot/setthreadtopic?` + queryString.stringify(queryParameter)
      );

      if (response.ok) {
        onChangeName({ id: element.thread_id, topic });
      } else {
        // todo: handle fail
      }
    }
    setShowModal(false);
  }

  return (
    <>
      <div
        className="mb-2 color d-flex justify-content-between"
        onMouseEnter={() => setShowOptions(true)}
        onMouseLeave={() => setShowOptions(false)}
      >
        <OverlayTrigger
          key={`${element.thread_id}-tooltip`}
          overlay={<Tooltip>{element.topic}</Tooltip>}
        >
          <a
            href=""
            className="text-truncate"
            onClick={() => changeToThread(element.thread_id)}
          >
            {element.topic}
          </a>
        </OverlayTrigger>
        {showOptions ? (
          <Badge
            bg="secondary"
            style={{ cursor: "pointer" }}
            onClick={() => setShowModal(true)}
          >
            <FaPen />
          </Badge>
        ) : null}
      </div>

      <Modal
        size="s"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        show={showModal}
        onHide={() => {
          setShowModal(false);
        }}
      >
        <Modal.Header closeButton>Rename chat</Modal.Header>
        <Modal.Body>
          <FormControl
            as="textarea"
            value={topic}
            onChange={handleTopicInput}
            placeholder="Set a title"
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="info" onClick={renameThread}>
            Rename
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

ThreadLink.propTypes = {
  element: PropTypes.object,
  onChangeName: PropTypes.func,
};

export default ThreadLink;
