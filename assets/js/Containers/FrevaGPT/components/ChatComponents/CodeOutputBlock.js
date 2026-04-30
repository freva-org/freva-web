import React, { useEffect } from "react";
import { Card } from "react-bootstrap";

import PropTypes from "prop-types";
import hljs from "highlight.js";

import { formatCode, extractVariantFromArray } from "../../utils";
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
    const output = extractVariantFromArray("CodeOutput", content);

    if (output !== undefined && output.content.length > 1) {
      return (
        <Card.Footer className="p-0 m-0" key={`${content[1].id}-codeoutput`}>
          <div className="bc-output-header">Terminal</div>
          <pre className="codeoutputblock m-0">
            <code>{formatCode("CodeOutput", output.content)[0]}</code>
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
