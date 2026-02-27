import React, { useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import hljs from "highlight.js";
import "highlight.js/styles/stackoverflow-light.css";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { FaBook } from "react-icons/fa";

import { Col, Card } from "react-bootstrap";

import { replaceLinebreaks, setGivenFeedbackValue } from "../../utils";

import * as constants from "../../constants";

import FeedbackButtons from "../Snippets/FeedbackButtons";

function AssistantBlock({ content, streaming }) {
  useEffect(() => {
    // hilights all inline code elements
    document.querySelectorAll("pre code").forEach((block) => {
      if (!block.dataset.highlighted) {
        hljs.highlightElement(block);
      }
    });
  }, []);

  const grepReferences = useMemo(() => {
    const regex = /\[.*\]\(.*\)/g;
    const markdown_links = content.content.match(regex);
    const references = [];

    for (const elem in markdown_links) {
      const data = {};
      try {
        const links = markdown_links[elem].split("](");
        data.description = links[0].slice(1);
        data.link = links[1].slice(0, -1);

        references.push(data);
      } catch (e) {
        //eslint-disable-next-line no-console
        console.log(`The reference seems to not be formatted well: ${e}`);
      }
    }
    return references;
  }, [content]);

  return (
    <Col md={constants.BOT_COLUMN_STYLE} className="mb-3">
      <Card className="bot-shadow br-8 card-body border-0 border-bottom mb-2 bg-light">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {replaceLinebreaks(content.content).replaceAll(
            "utm_source=openai",
            ""
          )}
        </ReactMarkdown>

        <div>
          {grepReferences.map((element) => {
            return (
              <span
                key={`${element.description}-${content.original_index}-reference`}
                className="color bot-shadow br-8 bot-references me-1 bot-bg-lg"
                role="button"
              >
                <a href={element.link}>
                  <FaBook className="me-1" color="grey" />
                  {element.description}
                </a>
              </span>
            );
          })}
        </div>

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
