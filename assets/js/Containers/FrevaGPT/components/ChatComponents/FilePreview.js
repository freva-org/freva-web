import React from "react";

import PropTypes from "prop-types";

import { isEmpty } from "lodash";

import { FaExclamationTriangle } from "react-icons/fa";

import FileItem from "../Snippets/FileItem";

function FilePreview({ content }) {
  const imagesFiles = content.filter((elem) =>
    elem.mime_type.includes("image")
  );
  const otherFiles = content.filter(
    (elem) => !elem.mime_type.includes("image")
  );

  function renderFilePreview() {
    if (!isEmpty(content)) {
      return (
        <>
          <ul className="p-0 mb-0 mt-1">
            {imagesFiles.map((elem) => (
              <FileItem key={elem.path} content={elem} />
            ))}
          </ul>
          <ul className="p-0 mb-0 mt-1">
            {otherFiles.map((elem) => (
              <FileItem key={elem.path} content={elem} />
            ))}
          </ul>
          {!isEmpty(otherFiles) ? (
            <span className="text-danger">
              <FaExclamationTriangle className="me-2" />
              Please be aware that the generated files could contain faulty or
              malicious content.
            </span>
          ) : null}
        </>
      );
    } else {
      return null;
    }
  }

  return renderFilePreview(content);
}

FilePreview.propTypes = {
  content: PropTypes.array,
};

export default FilePreview;
