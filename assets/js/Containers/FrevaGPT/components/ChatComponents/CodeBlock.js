import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Collapse, Button } from "react-bootstrap";
import { FaAngleDown, FaAngleUp, FaRegCopy } from "react-icons/fa";

import PropTypes from "prop-types";
import hljs from "highlight.js";
import "highlight.js/styles/stackoverflow-light.css";

import { isEmpty, has } from "lodash";

import {
  formatCode,
  setGivenFeedbackValue,
  extractElements,
} from "../../utils";

import FeedbackButtons from "../Snippets/FeedbackButtons";
import { setMessageToastContent, setShowMessageToast } from "../../actions";

import CodeOutputBlock from "./CodeOutputBlock";
import FilePreview from "./FilePreview";

function CodeBlock({ showCode, content }) {
  const [localShowCode, setLocalShowCode] = useState();
  const dispatch = useDispatch();

  const codeContent = extractElements(content, "Code");
  const codeOutput = extractElements(content, "CodeOutput");
  let fileOutput = [];

  if (!isEmpty(codeOutput)) {
    try {
      if (has(codeOutput.content, "created_files")) {
        fileOutput = codeOutput.content.created_files;
      }
    } catch (err) {
      //pass
    }
  }

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

  function renderCodeOptions() {
    return (
      <div className="d-flex align-items-center me-2">
        <Button variant="link" onClick={copyCode}>
          <span>
            <FaRegCopy className="bc-color" size="20" />
          </span>
        </Button>
        <FeedbackButtons
          elementIndex={content[0].feedback_index}
          givenValue={setGivenFeedbackValue(extractElements(content, "Code"))}
          defaultColor="#abb2bf"
        />
      </div>
    );
  }

  return (
    <div className="mb-3">
      <div
        className={`d-flex justify-content-between bc-code-header align-items-center ${localShowCode ? "br-8-t" : "br-8 bot-shadow"}`}
      >
        <div
          className={`p-2 bc-code-body ${localShowCode ? "bc-code-header-tab br-8-tl" : "br-8-l"}`}
          role="button"
          onClick={() => {
            setLocalShowCode(!localShowCode);
          }}
        >
          Code {localShowCode ? <FaAngleUp /> : <FaAngleDown />}
        </div>
        {localShowCode ? renderCodeOptions() : null}
      </div>

      <Collapse in={localShowCode} className="bn mb-3">
        <div className="p-0 m-0 border-bottom" key={`${content[0].id}-code`}>
          <div
            className={`d-flex bc-code-body ${codeOutput && isEmpty(codeOutput.content) ? "br-8-b bot-shadow" : ""}`}
          >
            <div className="bc-code-margin"></div>
            <pre className="m-0 codeblock">
              <code className="language-python">
                {formatCode("Code", codeContent.content)}
              </code>
            </pre>
          </div>
          <CodeOutputBlock content={codeOutput} />
        </div>
      </Collapse>
      <FilePreview content={fileOutput} />
    </div>
  );
}

CodeBlock.propTypes = {
  content: PropTypes.array,
  showCode: PropTypes.bool,
};

export default CodeBlock;
