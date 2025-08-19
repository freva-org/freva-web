import React from "react";
import PropTypes from "prop-types";

import { Card } from "react-bootstrap";

import ThreadLink from "./ThreadLink";

function ThreadPanel({ threads, title }) {
  return (
    <Card className="my-2 shadow-sm">
      <Card.Header className="outline-secondary border-0 p-3 rounded-top text-start card-header shadow-sm">
        {title}
      </Card.Header>
      <Card.Body className="p-3 py-2">
        {threads.map((element) => {
          return <ThreadLink key={element.thread_id} element={element} />;
        })}
      </Card.Body>
    </Card>
  );
}

ThreadPanel.propTypes = {
  threads: PropTypes.array,
  title: PropTypes.string,
};

export default ThreadPanel;
