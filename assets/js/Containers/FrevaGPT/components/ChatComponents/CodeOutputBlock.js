import React, { useEffect, useState } from "react";

import { isEmpty } from "lodash";

import PropTypes from "prop-types";
import hljs from "highlight.js";

import { Collapse } from "react-bootstrap";
import { FaAngleDown, FaAngleUp } from "react-icons/fa";

import "highlight.js/styles/atom-one-dark.css";
import { extractOutput } from "../../utils";

function CodeOutputBlock({ content }) {
  const [showOutput, setShowOutput] = useState(false);
  const output = extractOutput(content);

  useEffect(() => {
    // hilights all code elements
    document.querySelectorAll(".codeoutputblock code").forEach((block) => {
      if (!block.dataset.highlighted) {
        hljs.highlightElement(block);
      }
    });
  }, []);

  function renderCodeOutput(content) {
    if (!isEmpty(output)) {
      return (
        <div className="p-0 m-0" key={`${content.id}-codeoutput`}>
          <div
            className={`bc-output-header ${showOutput ? "" : "br-8-b"}`}
            role="button"
            onClick={() => setShowOutput(!showOutput)}
          >
            Output {showOutput ? <FaAngleUp /> : <FaAngleDown />}
          </div>
          <Collapse in={showOutput}>
            <pre
              className={`codeoutputblock m-0 ${showOutput ? "br-8-b" : ""}`}
            >
              <code>{output}</code>
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
