import { useEffect, useState, useCallback } from "react";

import { debounce, isEmpty } from "lodash";

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
    // TODO: use search endpoint with actual query values
    const response = await fetchWithAuth(`/api/chatbot/getuserthreads`);

    if (response.ok) {
      const values = await response.json();
      setFilteredThreads(values);
    }

    setFilteredThreadsLoading(false);
  }

  const search = useCallback(debounce(filterThreads, 200), []);

  return { filteredThreads, filteredThreadsLoading };
}
