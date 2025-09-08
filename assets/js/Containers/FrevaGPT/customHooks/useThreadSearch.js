import { useEffect, useState, useCallback } from "react";

import { debounce, isEmpty } from "lodash";

import queryString from "query-string";

import { fetchWithAuth } from "../utils";

export default function useThreadSearch(query) {
  const [filteredThreads, setFilteredThreads] = useState([]);
  const [filteredThreadsLoading, setFilteredThreadsLoading] = useState(true);

  useEffect(() => {
    setFilteredThreads([]);
  }, []);

  useEffect(() => {
    if (!isEmpty(query)) {
      search();
    }
  }, [query]);

  async function filterThreads() {
    setFilteredThreadsLoading(true);
    setFilteredThreads([]);

    const queryParameter = {
      num_threads: 30,
      query,
    };

    const response = await fetchWithAuth(
      `/api/chatbot/searchthreads?` + queryString.stringify(queryParameter)
    );

    if (response.ok) {
      const values = await response.json();
      setFilteredThreads(values);
    }

    setFilteredThreadsLoading(false);
  }

  const search = useCallback(debounce(filterThreads, 200), []);

  return { filteredThreads, filteredThreadsLoading };
}
