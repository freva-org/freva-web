import { useEffect, useState, useCallback } from "react";

import { debounce } from "lodash";

import { fetchWithAuth } from "../utils";

export default function useThreadSearch(query) {
  const [filteredThreads, setFilteredThreads] = useState([]);
  //const [threadsLoading, setThreadsLoading] = useState(true);

  useEffect(() => {
    setFilteredThreads([]);
  }, []);

  useEffect(() => {
    //setThreadsLoading(true);
    search();
    //setThreadsLoading(false);
  }, [query]);

  async function filterThreads() {
    setFilteredThreads([]);
    // TODO: use search endpoint with actual query values
    const response = await fetchWithAuth(`/api/chatbot/getuserthreads`);

    if (response.ok) {
      const values = await response.json();
      setFilteredThreads(values);
    }
  }

  const search = useCallback(debounce(filterThreads, 200), []);

  return { filteredThreads };
}
