import React, { useState } from "react";
import PropTypes from "prop-types";

import { browserHistory } from "react-router";

import {
  OverlayTrigger,
  Tooltip,
  Badge,
  ListGroup,
  Popover,
} from "react-bootstrap";

import { FaEllipsisH, FaEdit, FaRegHeart } from "react-icons/fa";

function ThreadLink({ element }) {
  const [showOptions, setShowOptions] = useState(false);

  function changeToThread(thread) {
    browserHistory.push({
      pathname: "/chatbot/",
      search: `?thread_id=${thread}`,
    });
  }

  function showThreadOptions() {
    setShowOptions(true);
  }

  function hideThreadOptions() {
    setShowOptions(false);
  }

  function renameThread() {}

  function addThreadToFavorites() {}

  function removeThreadFromFavorites() {}

  const popover = (
    <Popover id="popover-basic">
      <ListGroup>
        <ListGroup.Item
          action
          className="d-flex align-items-center"
          onClick={renameThread}
        >
          <FaEdit style={{ marginRight: "5px" }} />
          Rename
        </ListGroup.Item>
        <ListGroup.Item
          action
          className="d-flex align-items-center"
          onClick={
            element.favorite ? removeThreadFromFavorites : addThreadToFavorites
          }
        >
          <FaRegHeart style={{ marginRight: "5px" }} />{" "}
          {element.favorite ? "Remove from favorites" : "Add to favorites"}
        </ListGroup.Item>
      </ListGroup>
    </Popover>
  );

  return (
    <div
      className="mb-2 color d-flex justify-content-between"
      onMouseEnter={showThreadOptions}
      onMouseLeave={hideThreadOptions}
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
  );
}

ThreadLink.propTypes = {
  element: PropTypes.object,
};

export default ThreadLink;
