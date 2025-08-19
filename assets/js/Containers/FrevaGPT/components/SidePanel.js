import React, { useEffect, useState } from "react";

import { isEmpty } from "lodash";

import { fetchWithAuth } from "../utils";

import ThreadPanel from "./ThreadPanel";

function SidePanel() {
  const [threads, setThreads] = useState([]);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    async function getHistory() {
      const response = await fetchWithAuth(`/api/chatbot/getuserthreads`);

      if (response.ok) {
        const values = await response.json();
        //eslint-disable-next-line no-console
        console.log(values);
        setThreads(values);
      }
    }

    async function getFavorites() {
      setFavorites([]);
    }

    getHistory();
    getFavorites();
  }, []);

  return (
    <>
      {!isEmpty(favorites) ? (
        <ThreadPanel threads={favorites} title="Favorite chats" />
      ) : null}

      <ThreadPanel threads={threads} title="Chats" />
    </>
  );
}

export default SidePanel;
