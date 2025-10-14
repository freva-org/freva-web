import React, { useEffect, useState, useRef, useCallback } from "react";

import { Card, FormControl, Row } from "react-bootstrap";

import { isEmpty } from "lodash";

import useThreadSearch from "../../customHooks/useThreadSearch";
import useGeneralThreads from "../../customHooks/useGeneralThreads";

import TextPlaceholder from "../Snippets/TextPlaceholder";

import ThreadList from "./ThreadList";

function SidePanel() {
  const [loading, setLoading] = useState(true);

  // unfiltered threads for default display
  const { threads, setThreads, threadsLoading, setPageNumber } =
    useGeneralThreads();

  // filtered threads based on query
  const [query, setQuery] = useState("");
  const {
    filteredThreads,
    setFilteredThreads,
    filteredThreadsLoading,
    setFilteredPageNumber,
  } = useThreadSearch(query);

  const observer = useRef();
  const lastThreadRef = useCallback(
    (node) => {
      if (loading) {
        return;
      }
      if (observer.current) {
        observer.current.disconnect();
      }
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          if (query) {
            setFilteredPageNumber(
              (prevFilteredPageNumber) => prevFilteredPageNumber + 1
            );
          } else {
            setPageNumber((prevPageNumber) => prevPageNumber + 1);
          }
        }
      });
      if (node) {
        observer.current.observe(node);
      }
    },
    [loading]
  );

  useEffect(() => {
    setLoading(!isEmpty(query) ? filteredThreadsLoading : threadsLoading);
  }, [threadsLoading, filteredThreadsLoading, query]);

  function handleSearchInput(e) {
    setQuery(e.target.value);
  }

  const threadStyle = {
    maxHeight: document.documentElement.clientHeight * 0.5,
  };

  function renderThreads(list, setter) {
    if (!loading && isEmpty(list)) {
      return <p>No chats found</p>;
    } else {
      return <ThreadList threadList={list} setThreadList={setter} />;
    }
  }

  return (
    <>
      <Card className="shadow-sm">
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

          <Row className="overflow-auto" style={threadStyle}>
            {query
              ? renderThreads(filteredThreads, setFilteredThreads)
              : renderThreads(threads, setThreads)}
            {loading ? <TextPlaceholder /> : null}
            <div ref={lastThreadRef} className="p-1"></div>
          </Row>
        </Card.Body>
      </Card>
    </>
  );
}

export default SidePanel;
