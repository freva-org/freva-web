import React, { useEffect, useState } from "react";

import PropTypes from "prop-types";
import hljs from "highlight.js";

import { Collapse } from "react-bootstrap";
import { FaAngleDown, FaAngleUp } from "react-icons/fa";

import { formatCode } from "../../utils";
import "highlight.js/styles/atom-one-dark.css";

function CodeOutputBlock({ content }) {
  const [showOutput, setShowOutput] = useState(false);

  useEffect(() => {
    // hilights all code elements
    document.querySelectorAll(".codeoutputblock code").forEach((block) => {
      if (!block.dataset.highlighted) {
        hljs.highlightElement(block);
      }
    });
  }, []);

  function extractElements(content, variant) {
    // should be only one resulting item
    return content.filter((elem) => elem.variant === variant)[0];
  }

  function renderCodeOutput(content) {
    if (content.length > 1) {
      return (
        <div className="p-0 m-0" key={`${content[1].id}-codeoutput`}>
          <div
            className="bc-output-header"
            role="button"
            onClick={() => setShowOutput(!showOutput)}
          >
            Output {showOutput ? <FaAngleUp /> : <FaAngleDown />}
          </div>
          <Collapse in={showOutput}>
            <pre className="codeoutputblock m-0">
              <code>
                {formatCode(
                  "CodeOutput",
                  extractElements(content, "CodeOutput").content[0]
                )}
              </code>
            </pre>
          </Collapse>
        </div>
      );
    } else {
      return null;
    }
  }

  return <>{renderCodeOutput(content)}</>;
}

CodeOutputBlock.propTypes = {
  content: PropTypes.array,
};

export default CodeOutputBlock;
