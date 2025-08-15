import React, { useEffect, useState } from "react";
import { Card, OverlayTrigger, Tooltip } from "react-bootstrap";

import { browserHistory } from "react-router";

import { fetchWithAuth } from "../utils";

function SidePanel() {
  const [threads, setThreads] = useState([]);

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

    getHistory();
  }, []);

  function changeToThread(thread) {
    browserHistory.push({
      pathname: "/chatbot/",
      search: `?thread_id=${thread}`,
    });
  }

  return (
    <Card className="mb-3 shadow-sm">
      <Card.Header className="outline-secondary border-0 p-3 rounded-top text-start card-header shadow-sm">
        Previous chats
      </Card.Header>
      <Card.Body className="p-3 py-2">
        {threads.map((element) => {
          return (
            <div key={element.thread_id} className="mb-2 text-truncate color">
              <OverlayTrigger
                key={`${element.thread_id}-tooltip`}
                overlay={<Tooltip>{element.topic}</Tooltip>}
              >
                <a href="" onClick={() => changeToThread(element.thread_id)}>
                  {element.topic}
                </a>
              </OverlayTrigger>
            </div>
          );
        })}
      </Card.Body>
    </Card>
  );
}

export default SidePanel;
