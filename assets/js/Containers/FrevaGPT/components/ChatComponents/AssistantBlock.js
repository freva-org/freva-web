import React, { useEffect } from "react";
import PropTypes from "prop-types";
import hljs from "highlight.js";
import "highlight.js/styles/stackoverflow-light.css";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Col, Card } from "react-bootstrap";

import { replaceLinebreaks, setGivenFeedbackValue } from "../../utils";

import * as constants from "../../constants";

import FeedbackButtons from "../Snippets/FeedbackButtons";
import ReferenceItem from "../Snippets/ReferenceItem";

function AssistantBlock({ content, streaming }) {
  useEffect(() => {
    // hilights all inline code elements
    document.querySelectorAll("pre code").forEach((block) => {
      if (!block.dataset.highlighted) {
        hljs.highlightElement(block);
      }
    });
  }, []);

  return (
    <Col md={constants.BOT_COLUMN_STYLE} className="mb-3">
      <Card className="bot-shadow br-8 card-body border-0 border-bottom mb-2 bg-light">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a(props) {
              //eslint-disable-next-line react/prop-types
              const link = props.href;
              //eslint-disable-next-line react/prop-types
              const title = props.title;
              return <ReferenceItem link={link} title={title ? title : link} />;
            },
          }}
        >
          {replaceLinebreaks(content.content).replaceAll(
            "utm_source=openai",
            ""
          )}
        </ReactMarkdown>

        {!streaming ? (
          <FeedbackButtons
            elementIndex={content.feedback_index}
            givenValue={setGivenFeedbackValue(content)}
          />
        ) : null}
      </Card>
    </Col>
  );
}

AssistantBlock.propTypes = {
  content: PropTypes.object,
  streaming: PropTypes.bool,
};

export default AssistantBlock;
