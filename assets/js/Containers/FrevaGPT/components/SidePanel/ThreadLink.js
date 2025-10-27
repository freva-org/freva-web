import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";

import { browserHistory } from "react-router";

import { isEmpty } from "lodash";

import queryString from "query-string";

import { Modal, Button, FormControl, ListGroup } from "react-bootstrap";

import { FaPen } from "react-icons/fa";

import { fetchWithAuth } from "../../utils";
import useHoverThread from "../../customHooks/useHoverThread";

function ThreadLink({ element, onChangeName }) {
  const [showModal, setShowModal] = useState(false);
  const [topic, setTopic] = useState(element.topic);
  const ref = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showEditButton, setShowEditButton] = useState(false);

  useHoverThread({ hovered, setHovered, ref });

  useEffect(() => {
    const minWidth = 768; // Minimum width for desktop devices
    setIsMobile(window.innerWidth < minWidth || screen.width < minWidth);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setShowEditButton(true); // alsway show edit button on mobile devices
    } else {
      setShowEditButton(hovered); // only show edit button on hover for desktop devices
    }
  }, [isMobile, hovered]);

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
      <ListGroup.Item
        className="px-0"
        ref={ref}
        onMouseEnter={() => setHovered(true)}
      >
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <a
              href=""
              className="forced-textwrap"
              onClick={() => changeToThread(element.thread_id)}
            >
              {element.topic}
            </a>
          </div>

          {
            showEditButton ? (
              <div
                role="button"
                className="align-content-center color"
                onClick={() => setShowModal(true)}
              >
                <FaPen />
              </div>
            ) : (
              <div className="align-content-center opacity-0">
                <FaPen />
              </div>
            ) /* invisible icon to avoid layout shift */
          }
        </div>
      </ListGroup.Item>

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
