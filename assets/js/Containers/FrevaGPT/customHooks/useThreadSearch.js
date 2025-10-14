import { useEffect, useState, useCallback } from "react";

import { debounce, isEmpty } from "lodash";

import { handleThreadsRequest } from "../utils";

export default function useThreadSearch(query) {
  const [filteredThreads, setFilteredThreads] = useState([]);
  const [filteredThreadsLoading, setFilteredThreadsLoading] = useState(true);
  const [filteredHasMore, setFilteredHasMore] = useState(false);
  const [filteredPageNumber, setFilteredPageNumber] = useState(0);

  useEffect(() => {
    setFilteredThreads([]);
  }, []);

  useEffect(() => {
    if (!isEmpty(query)) {
      search(query);
    }
  }, [query]);

  useEffect(() => {
    if (filteredHasMore) {
      handleThreadsRequest(
        filteredPageNumber,
        query,
        setFilteredThreadsLoading,
        setFilteredThreads,
        setFilteredHasMore
      );
    }
  }, [filteredPageNumber]);

  const search = useCallback(
    debounce((input) => {
      handleThreadsRequest(
        0,
        input,
        setFilteredThreadsLoading,
        setFilteredThreads,
        setFilteredHasMore
      );
    }, 1000),
    []
  );

  return {
    filteredThreads,
    setFilteredThreads,
    filteredThreadsLoading,
    setFilteredPageNumber,
  };
}
