import React from "react";

import PropTypes from "prop-types";

import { isEmpty } from "lodash";

import FileItem from "../Snippets/FileItem";

function FilePreview({ content }) {
  const imagesFiles = content.filter((elem) =>
    elem.mime_type.includes("image")
  );
  //const otherFiles = content.filter(elem => !elem.mime_type.includes("image"))

  function renderFilePreview() {
    if (!isEmpty(content)) {
      return (
        <>
          <ul className="p-0 mb-0 mt-1">
            {imagesFiles.map((elem) => (
              <FileItem key={elem.path} content={elem} />
            ))}
          </ul>
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

/*
<ul className="p-0 mb-0 mt-1">
    {otherFiles.map(elem => 
        <FileItem key={elem.path} content={elem}/>
    )}
</ul>
 */
