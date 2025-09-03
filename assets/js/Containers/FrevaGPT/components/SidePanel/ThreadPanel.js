import React, { useState } from "react";
import PropTypes from "prop-types";

import { Card, FormControl, Row } from "react-bootstrap";

import useThreadSearch from "../../customHooks/useThreadSearch";

import ThreadLink from "./ThreadLink";

function ThreadPanel({ threads, title }) {
  const [query, setQuery] = useState("");
  const { filteredThreads } = useThreadSearch(query);

  function handleSearchInput(e) {
    setQuery(e.target.value);
  }

  const threadStyle = {
    maxHeight: document.documentElement.clientHeight * 0.45,
  };

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
