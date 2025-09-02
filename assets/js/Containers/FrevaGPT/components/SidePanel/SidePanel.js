import React, { useEffect, useState } from "react";

import { fetchWithAuth } from "../../utils";

import ThreadPanel from "./ThreadPanel";

function SidePanel() {
  const [threads, setThreads] = useState([]);

  useEffect(() => {
    async function getHistory() {
      const response = await fetchWithAuth(`/api/chatbot/getuserthreads`);

      if (response.ok) {
        const values = await response.json();
        setThreads(values);
      }
    }

    getHistory();
  }, []);

  return (
    <>
      <ThreadPanel threads={threads} title="Chats" />
    </>
  );
}

export default SidePanel;
