import { useEffect, useState } from "react";

import { handleThreadsRequest } from "../utils";

export default function useGeneralThreads(showSidePanel) {
  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [pageNumber, setPageNumber] = useState(0);

  useEffect(() => {
    if (showSidePanel) {
      handleThreadsRequest(
        0,
        undefined,
        setThreadsLoading,
        setThreads,
        setHasMore
      );
    }
  }, [showSidePanel]);

  useEffect(() => {
    if (hasMore) {
      handleThreadsRequest(
        pageNumber,
        undefined,
        setThreadsLoading,
        setThreads,
        setHasMore
      );
    }
  }, [pageNumber]);

  return { threads, setThreads, threadsLoading, setPageNumber };
}
