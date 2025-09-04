import React, { useState } from "react";
import PropTypes from "prop-types";

import { browserHistory } from "react-router";

import { isEmpty } from "lodash";

import {
  OverlayTrigger,
  Tooltip,
  Badge,
  ListGroup,
  Popover,
  Modal,
  Button,
  FormControl,
} from "react-bootstrap";

import { FaEllipsisH, FaEdit } from "react-icons/fa";

function ThreadLink({ element }) {
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

  function renameThread() {
    // TODO: add backend call to change topic of thread
    if (!isEmpty(topic) && topic !== element.topic) {
      //request change to backend
      //change in frontend -> re-request or manual change?
    }
    setShowModal(false);
  }

  const popover = (
    <Popover id="popover-basic">
      <ListGroup>
        <ListGroup.Item
          action
          className="d-flex align-items-center"
          onClick={() => setShowModal(true)}
        >
          <FaEdit style={{ marginRight: "5px" }} />
          Rename
        </ListGroup.Item>
      </ListGroup>
    </Popover>
  );

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
          <OverlayTrigger trigger="click" placement="right" overlay={popover}>
            <Badge bg="secondary" as="button">
              <FaEllipsisH />
            </Badge>
          </OverlayTrigger>
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
};

export default ThreadLink;
