import React, { useEffect, useState } from "react";

import { Card, FormControl, Row } from "react-bootstrap";

import { isEmpty } from "lodash";

import { fetchWithAuth } from "../../utils";

import useThreadSearch from "../../customHooks/useThreadSearch";

import TextPlaceholder from "../Snippets/TextPlaceholder";

import ThreadLink from "./ThreadLink";

function SidePanel() {
  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { filteredThreads, filteredThreadsLoading } = useThreadSearch(query);

  useEffect(() => {
    async function getHistory() {
      setThreadsLoading(true);
      const response = await fetchWithAuth(`/api/chatbot/getuserthreads`);

      if (response.ok) {
        const values = await response.json();
        setThreads(values);
      }
      setThreadsLoading(false);
    }

    getHistory();
  }, []);

  useEffect(() => {
    if (!isEmpty(query)) {
      setLoading(filteredThreadsLoading);
    } else {
      setLoading(threadsLoading);
    }
  }, [threadsLoading, filteredThreadsLoading, query]);

  function handleSearchInput(e) {
    setQuery(e.target.value);
  }

  const threadStyle = {
    maxHeight: document.documentElement.clientHeight * 0.45,
  };

  return (
    <>
      <Card className="my-2 shadow-sm">
        <Card.Header className="outline-secondary border-0 p-3 rounded-top text-start card-header shadow-sm">
          Chats
        </Card.Header>
        <Card.Body className="p-3 py-2">
          <div>
            <FormControl
              className="my-2"
              id="search"
              type="text"
              placeholder={`Search chats`}
              onChange={handleSearchInput}
              value={query}
            />
          </div>

          {loading ? (
            <Row className="overflow-auto" style={threadStyle}>
              <TextPlaceholder />
            </Row>
          ) : (
            <Row className="overflow-auto" style={threadStyle}>
              {!isEmpty(filteredThreads)
                ? filteredThreads.map((element) => {
                    return (
                      <ThreadLink key={element.thread_id} element={element} />
                    );
                  })
                : threads.map((element) => {
                    return (
                      <ThreadLink key={element.thread_id} element={element} />
                    );
                  })}
            </Row>
          )}
        </Card.Body>
      </Card>
    </>
  );
}

export default SidePanel;
