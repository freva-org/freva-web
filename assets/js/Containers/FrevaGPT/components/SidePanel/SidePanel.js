import React, { useEffect, useState, useRef, useCallback } from "react";

import { FormControl, Offcanvas, Card } from "react-bootstrap";

import PropTypes from "prop-types";

import { isEmpty } from "lodash";

import useThreadSearch from "../../customHooks/useThreadSearch";
import useGeneralThreads from "../../customHooks/useGeneralThreads";

import TextPlaceholder from "../Snippets/TextPlaceholder";

import ThreadList from "./ThreadList";

function SidePanel({ showThreadHistory, setShowThreadHistory }) {
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

  function renderThreads(list, setter) {
    if (!loading && isEmpty(list)) {
      return <p>No chats found</p>;
    } else {
      return <ThreadList threadList={list} setThreadList={setter} />;
    }
  }

  return (
    <Offcanvas show={showThreadHistory} onHide={setShowThreadHistory}>
      <Offcanvas.Header>
        <Card className="mb-2 w-100">
          <Card.Body>
            <Card.Title>Search</Card.Title>
            <FormControl
              className="my-2"
              id="search"
              type="text"
              placeholder={`Search chats`}
              onChange={handleSearchInput}
              value={query}
            />
          </Card.Body>
        </Card>
      </Offcanvas.Header>

      <Offcanvas.Body>
        <Card>
          <Card.Body>
            <Card.Title>{query ? "Filtered History" : "History"}</Card.Title>
            {query
              ? renderThreads(filteredThreads, setFilteredThreads)
              : renderThreads(threads, setThreads)}
            {loading ? <TextPlaceholder /> : null}
            <div ref={lastThreadRef} className="p-1"></div>
          </Card.Body>
        </Card>
      </Offcanvas.Body>
    </Offcanvas>
  );
}

SidePanel.propTypes = {
  showThreadHistory: PropTypes.bool,
  setShowThreadHistory: PropTypes.func,
};

export default SidePanel;
