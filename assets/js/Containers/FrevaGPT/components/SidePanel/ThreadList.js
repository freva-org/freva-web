import React from "react";
import PropTypes from "prop-types";

import { ListGroup } from "react-bootstrap";

import ThreadLink from "./ThreadLink";

export default function ThreadList({ threadList, setThreadList }) {
  function updateThreadName(threadDetails) {
    const threadListCopy = structuredClone(threadList);
    const threadIndex = threadListCopy.findIndex(
      (elem) => elem.thread_id === threadDetails.id
    );
    threadListCopy[threadIndex].topic = threadDetails.topic;
    setThreadList(threadListCopy);
  }

  return (
    <ListGroup variant="flush">
      {threadList.map((element) => {
        return (
          <ThreadLink
            key={element.thread_id}
            element={element}
            onChangeName={updateThreadName}
          />
        );
      })}
    </ListGroup>
  );
}

ThreadList.propTypes = {
  threadList: PropTypes.array,
  setThreadList: PropTypes.func,
};
