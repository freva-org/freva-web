import React, { useEffect, useState } from "react";

import { isEmpty } from "lodash";

import PropTypes from "prop-types";
import hljs from "highlight.js";

import { Collapse, Button } from "react-bootstrap";
import { FaAngleDown, FaAngleUp } from "react-icons/fa";

import "highlight.js/styles/atom-one-dark.css";
import { extractOutput } from "../../utils";

function CodeOutputBlock({ content }) {
  const [showOutput, setShowOutput] = useState(true);
  const [showError, setShowError] = useState(false);
  const output = (extractOutput(content, "output") ?? "").trim() || "No output";
  const error = extractOutput(content, "error");

  useEffect(() => {
    // hilights all code elements
    document.querySelectorAll(".codeoutputblock code").forEach((block) => {
      if (!block.dataset.highlighted) {
        hljs.highlightElement(block);
      }
    });
  }, []);

  function renderCodeOutput(content) {
    if (!isEmpty(output) || !isEmpty(error)) {
      return (
        <div
          className={`bc-output-header p-0 ${showOutput ? "" : "br-8-b bot-shadow"}`}
          key={`${content.id}-codeoutput`}
          
        >
          <div className="d-flex">
              <div 
                className={`bc-output-tabs bc-color ${(!showError && showOutput) ? "bc-code-header-tab" : ""}`}
                role="button"
                onClick={() => setShowError(false)}
              >
                Output
              </div>
              {error ? 
                <div
                  className={`bc-output-tabs text-danger ${(showError && showOutput) ? "bc-code-header-tab" : ""}`}
                  role="button"
                  onClick={() => setShowError(true)}
                >
                  Problems
                </div> : null}
              

              <div className="left d-flex align-items-center me-2">
                <Button variant="link" onClick={() => setShowOutput(!showOutput)}>
                  <span>
                    {showOutput ? <FaAngleUp className="bc-color" /> : <FaAngleDown className="bc-color" />}
                  </span>
                </Button>
              </div>
          </div>
          
          <Collapse in={showOutput}>
            <pre
              className={`codeoutputblock m-0 ${showOutput ? "br-8-b bot-shadow" : ""}`}
            >
              <code>{showError ? error : output}</code>
            </pre>
          </Collapse>
        </div>
      );
    } else {
      return null;
    }
  }

  return renderCodeOutput(content);
}

CodeOutputBlock.propTypes = {
  content: PropTypes.object,
};

export default CodeOutputBlock;

//{showOutput ? <FaAngleUp /> : <FaAngleDown />}
//className={`bc-output-header ${showOutput ? "" : "br-8-b bot-shadow"}`}