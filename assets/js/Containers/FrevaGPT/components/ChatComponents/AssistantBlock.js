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

function AssistantBlock({ content }) {
  useEffect(() => {
    // hilights all inline code elements
    document.querySelectorAll("pre code").forEach((block) => {
      if (!block.dataset.highlighted) {
        hljs.highlightElement(block);
      }
    });
  }, []);

  return (
    <Col md={constants.BOT_COLUMN_STYLE}>
      <Card className="shadow-sm card-body border-0 border-bottom mb-3 bg-light">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {replaceLinebreaks(content.content)}
        </ReactMarkdown>
        <FeedbackButtons
          elementIndex={content.original_index}
          givenValue={setGivenFeedbackValue(content)}
        />
      </Card>
    </Col>
  );
}

AssistantBlock.propTypes = {
  content: PropTypes.object,
};

export default AssistantBlock;
