import React from "react";
import { Card, OverlayTrigger, Tooltip } from "react-bootstrap";
import { browserHistory } from "react-router";

import { botRequests } from "../exampleRequests";

function SidePanel() {
  function changeToThread(thread) {
    browserHistory.push({
      pathname: "/chatbot/",
      search: `?thread_id=${thread}`,
    });
  }

  // Utility function to render a section of requests
  function renderRequestSection(title, requestList) {
    return (
      <Card className="mb-3 shadow-sm" key={title}>
        <Card.Header className="outline-secondary border-0 p-3 rounded-top text-start card-header shadow-sm">
          {title}
        </Card.Header>
        <Card.Body className="p-3 py-2">
          {requestList.map((element) => (
            <div key={element.thread} className="mb-2 text-truncate color">
              <OverlayTrigger
                key={`${element.title}-tooltip`}
                overlay={<Tooltip>{element.title}</Tooltip>}
              >
                <a href="" onClick={() => changeToThread(element.thread)}>
                  {element.title}
                </a>
              </OverlayTrigger>
            </div>
          ))}
        </Card.Body>
      </Card>
    );
  }

  return (
    <>
      {renderRequestSection("General requests", botRequests.general)}
      {renderRequestSection("EVE requests", botRequests.eve)}
      {renderRequestSection("Freva requests", botRequests.freva)}
    </>
  );
}

export default SidePanel;
