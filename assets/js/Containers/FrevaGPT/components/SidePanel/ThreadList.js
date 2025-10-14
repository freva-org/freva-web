import React from "react";
import PropTypes from "prop-types";

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
    <>
      {threadList.map((element) => {
        return (
          <ThreadLink
            key={element.thread_id}
            element={element}
            onChangeName={updateThreadName}
          />
        );
      })}
    </>
  );
}

ThreadList.propTypes = {
  threadList: PropTypes.array,
  setThreadList: PropTypes.func,
};
