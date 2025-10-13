import React, { useState, useRef } from "react";
import PropTypes from "prop-types";

import { browserHistory } from "react-router";

import { isEmpty } from "lodash";

import queryString from "query-string";

import {
  Modal,
  Button,
  FormControl,
  ListGroup,
  Col,
  Row,
} from "react-bootstrap";

import { FaPen } from "react-icons/fa";

import { fetchWithAuth } from "../../utils";
import useHoverThread from "../../customHooks/useHoverThread";

function ThreadLink({ element, onChangeName }) {
  const [showModal, setShowModal] = useState(false);
  const [topic, setTopic] = useState(element.topic);
  const ref = useRef(null);
  const [hovered, setHovered] = useState(false);

  useHoverThread({ hovered, setHovered, ref });

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
      <ListGroup.Item ref={ref} onMouseEnter={() => setHovered(true)}>
        <Row>
          <Col>
            <a href="" onClick={() => changeToThread(element.thread_id)}>
              {element.topic}
            </a>
          </Col>
          {hovered ? (
            <Col
              md={1}
              role="button"
              className="align-content-center color"
              onClick={() => setShowModal(true)}
            >
              <FaPen />
            </Col>
          ) : null}
        </Row>
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
