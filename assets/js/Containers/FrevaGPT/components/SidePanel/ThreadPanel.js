import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

import { Card, FormControl, Row } from "react-bootstrap";

import { fetchWithAuth } from "../../utils";

import ThreadLink from "./ThreadLink";

function ThreadPanel({ threads, title }) {
  const [filteredThreads, setFilteredThreads] = useState([]);
  const [query, setQuery] = useState("");

  //const controller = new AbortController();
  //const signal = controller.signal;

  useEffect(() => {
    async function searchThreads() {
      setFilteredThreads([]);
      const response = await fetchWithAuth(`/api/chatbot/getuserthreads`);

      if (response.ok) {
        const values = await response.json();
        setFilteredThreads(values);
      }
    }

    /*async function searchThreads() {
      setFilteredThreads([]);

      const response = await fetchWithAuth(`/api/chatbot/getuserthreads`, {signal}).then(res => {
        if (res.ok) {
          const values = res.json();
          return values;
        } else {
          return [];
        }
      }).catch(err => {
        if (signal.aborted && err instanceof DOMException && err.name === "AbortError") {
          return
        }
      })

      setFilteredThreads(response);
    }*/

    searchThreads();
    //return () => controller.abort();
  }, [query]);

  const threadStyle = {
    maxHeight: document.documentElement.clientHeight * 0.45,
  };

  function handleSearchInput(e) {
    setQuery(e.target.value);
  }

  return (
    <Card className="my-2 shadow-sm">
      <Card.Header className="outline-secondary border-0 p-3 rounded-top text-start card-header shadow-sm">
        {title}
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

        <Row className="overflow-auto" style={threadStyle}>
          {filteredThreads
            ? filteredThreads.map((element) => {
                return <ThreadLink key={element.thread_id} element={element} />;
              })
            : threads.map((element) => {
                return <ThreadLink key={element.thread_id} element={element} />;
              })}
        </Row>
      </Card.Body>
    </Card>
  );
}

ThreadPanel.propTypes = {
  threads: PropTypes.array,
  title: PropTypes.string,
};

export default ThreadPanel;
