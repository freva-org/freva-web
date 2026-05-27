import React from "react";
import PropTypes from "prop-types";

import ThreadLink from "./ThreadLink";

export default function ThreadList({ threadList, setThreadList }) {
  function updateThreadList(mode, threadDetails) {
    const threadListCopy = structuredClone(threadList);
    const threadIndex = threadListCopy.findIndex(
      (elem) => elem.thread_id === threadDetails.thread_id
    );
    if (mode === "rename") {
      threadListCopy[threadIndex].topic = threadDetails.topic;
    } else {
      threadListCopy.splice(threadIndex, 1);
    }
    setThreadList(threadListCopy);
  }

  return (
    <div>
      {threadList.map((element) => {
        return (
          <ThreadLink
            key={element.thread_id}
            element={element}
            updateThreadList={updateThreadList}
          />
        );
      })}
    </div>
  );
}

ThreadList.propTypes = {
  threadList: PropTypes.array,
  setThreadList: PropTypes.func,
};
