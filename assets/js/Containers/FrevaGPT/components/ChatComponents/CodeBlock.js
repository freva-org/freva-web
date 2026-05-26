import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Card, Collapse, Button } from "react-bootstrap";
import { FaAngleDown, FaAngleUp, FaRegCopy, FaPython } from "react-icons/fa";

import PropTypes from "prop-types";
import hljs from "highlight.js";
import "highlight.js/styles/stackoverflow-light.css";

import {
  formatCode,
  setGivenFeedbackValue,
  extractVariantFromArray,
} from "../../utils";

import FeedbackButtons from "../Snippets/FeedbackButtons";
import { setMessageToastContent, setShowMessageToast } from "../../actions";

import CodeOutputBlock from "./CodeOutputBlock";

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

  function copyCode() {
    const code = formatCode(
      "Code",
      extractVariantFromArray("Code", content).content
    );
    navigator.clipboard.writeText(code);
    dispatch(
      setMessageToastContent({
        color: "success",
        message: "Code copied to clipboard!",
      })
    );
    dispatch(setShowMessageToast(true));
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
            elementIndex={content[0].feedback_index}
            givenValue={setGivenFeedbackValue(
              extractVariantFromArray("Code", content)
            )}
          />
        </div>

        <Collapse in={localShowCode} className="mt-2">
          <Card className="shadow-sm">
            <Card.Body
              className="p-0 m-0 border-bottom"
              key={`${content[0].id}-code`}
            >
              <div className="d-flex justify-content-between bc-code-header">
                <div className="p-2 bc-code-body bc-code-header-tab">
                  <FaPython /> main.py
                </div>
                <Button variant="link" onClick={copyCode}>
                  <span>
                    <FaRegCopy className="bc-color" />
                  </span>
                </Button>
              </div>

              <div className="d-flex bc-code-body">
                <div className="bc-code-margin"></div>
                <pre className="m-0 codeblock">
                  <code className="language-python">
                    {
                      formatCode(
                        "Code",
                        extractVariantFromArray("Code", content).content
                      )[0]
                    }
                  </code>
                </pre>
              </div>
              <CodeOutputBlock content={content} />
            </Card.Body>
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
