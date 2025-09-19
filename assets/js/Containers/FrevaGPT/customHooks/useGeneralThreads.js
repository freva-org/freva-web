import { useEffect, useState } from "react";

import { handleThreadsRequest } from "../utils";

export default function useGeneralThreads() {
  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);

  useEffect(() => {
    handleThreadsRequest(
      0,
      undefined,
      setThreadsLoading,
      setThreads,
      setHasMore
    );
  }, []);

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
