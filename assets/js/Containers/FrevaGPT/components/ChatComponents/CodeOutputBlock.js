import React, { useEffect } from "react";
import { Card } from "react-bootstrap";

import { isEmpty } from "lodash";

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

  function renderCodeOutput(content) {
    if (!isEmpty(content)) {
      return (
        <Card.Footer className="p-0 m-0" key={`${content.id}-codeoutput`}>
          <pre className="codeoutputblock m-0">
            <code className="bot-code-output">
              {formatCode("CodeOutput", content.content)}
            </code>
          </pre>
        </Card.Footer>
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
