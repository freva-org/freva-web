import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import PropTypes from "prop-types";
import hljs from "highlight.js";
import "highlight.js/styles/stackoverflow-light.css";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Col, Card, Button } from "react-bootstrap";
import { FaBook } from "react-icons/fa";

import { replaceLinebreaks, setGivenFeedbackValue } from "../../utils";

import * as constants from "../../constants";

import { setShowReferencePanel } from "../../actions";

import FeedbackButtons from "../Snippets/FeedbackButtons";
import ReferenceItem from "../ReferenceComponents/ReferenceItem";

function AssistantBlock({ content, streaming }) {
  const dispatch = useDispatch();
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

        <Button
          className="br-8 bot-shadow"
          variant="secondary"
          onClick={() => dispatch(setShowReferencePanel(true))}
        >
          <FaBook className="me-2" />
          References
        </Button>

        {!streaming ? (
          <FeedbackButtons
            elementIndex={content.original_index}
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
