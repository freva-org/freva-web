import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Card, Collapse, Button } from "react-bootstrap";
import { FaAngleDown, FaAngleUp, FaRegCopy } from "react-icons/fa";

import PropTypes from "prop-types";
import hljs from "highlight.js";
import "highlight.js/styles/stackoverflow-light.css";

import { formatCode, setGivenFeedbackValue } from "../../utils";

import FeedbackButtons from "../Snippets/FeedbackButtons";
import { setMessageToastContent, setShowMessageToast } from "../../actions";

function CodeBlock({ showCode, content }) {
  const [localShowCode, setLocalShowCode] = useState();
  const dispatch = useDispatch();

  useEffect(() => {
    setLocalShowCode(showCode);
  }, [showCode]);

  useEffect(() => {
    // hilights all code elements
    document.querySelectorAll(".codeblock code").forEach((block) => {
      if (!block.dataset.highlighted) {
        hljs.highlightElement(block);
      }
    });
  }, []);

  function localToggleShowCode() {
    setLocalShowCode(!localShowCode);
  }

  function extractElements(content, variant) {
    // should be only one resulting item
    return content.filter((elem) => elem.variant === variant)[0];
  }

  function copyCode() {
    const code = formatCode("Code", extractElements(content, "Code").content);
    navigator.clipboard.writeText(code);
    dispatch(
      setMessageToastContent({
        color: "success",
        message: "Code copied to clipboard!",
      })
    );
    dispatch(setShowMessageToast(true));
  }

  function renderCodeOutput(content) {
    //TODO original_id added when rearranged?
    if (content.length > 1) {
      return (
        <Card.Footer className="p-0 m-0" key={`${content[1].id}-codeoutput`}>
          <pre className="codeblock m-0">
            <code className="bot-code-output">
              {
                formatCode(
                  "CodeOutput",
                  extractElements(content, "CodeOutput").content
                )[0]
              }
            </code>
          </pre>
        </Card.Footer>
      );
    } else {
      return null;
    }
  }

  return (
    <>
      <Card className="bot-shadow br-8 card-body border-0 border-bottom mb-3 bg-light">
        <div className="d-flex justify-content-between">
          <Button
            variant="link"
            className="m-0 p-0 d-inline-flex text-decoration-none"
            onClick={() => {
              localToggleShowCode();
            }}
          >
            <strong className="color">Analyzed</strong>
            <span>
              {localShowCode ? (
                <FaAngleUp className="color" />
              ) : (
                <FaAngleDown className="color" />
              )}
            </span>
          </Button>
          <FeedbackButtons
            elementIndex={content[0].original_index}
            givenValue={setGivenFeedbackValue(extractElements(content, "Code"))}
          />
        </div>

        <Collapse in={localShowCode} className="mt-2">
          <Card className="shadow-sm">
            <Card.Header className="bot-bg-lg">
              <div className="d-flex justify-content-between align-items-center">
                python
                <Button variant="link" onClick={copyCode}>
                  <span>
                    <FaRegCopy className="color" />
                  </span>
                </Button>
              </div>
            </Card.Header>

            <Card.Body
              className="p-0 m-0 border-bottom"
              key={`${content[0].id}-code`}
            >
              <pre className="m-0 codeblock">
                <code>
                  {
                    formatCode(
                      "Code",
                      extractElements(content, "Code").content
                    )[0]
                  }
                </code>
              </pre>
            </Card.Body>
            {renderCodeOutput(content)}
          </Card>
        </Collapse>
      </Card>
    </>
  );
}

CodeBlock.propTypes = {
  content: PropTypes.array,
  showCode: PropTypes.bool,
};

export default CodeBlock;
