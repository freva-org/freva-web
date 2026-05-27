import React, { useEffect } from "react";
import { Card } from "react-bootstrap";

import PropTypes from "prop-types";
import hljs from "highlight.js";

import { formatCode } from "../../utils";
import "highlight.js/styles/atom-one-dark.css";

function CodeOutputBlock({ content }) {
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
        <Card.Footer className="p-0 m-0" key={`${content[1].id}-codeoutput`}>
          <pre className="codeoutputblock m-0">
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

  return <>{renderCodeOutput(content)}</>;
}

CodeOutputBlock.propTypes = {
  content: PropTypes.array,
};

export default CodeOutputBlock;
