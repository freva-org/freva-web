import React from "react";
import PropTypes from "prop-types";

function FileTree(props) {
  const { node } = props;
  let childNodes, cN, click;
  if (node.childNodes) {
    childNodes = node.childNodes.map((n, i) => {
      /* eslint-disable react/no-array-index-key */
      return <FileTree {...props} key={i} node={n} />;
    });
    cN = "directory expanded";
    click = props.handleClose;
  } else if (node.type === "file") {
    cN = `file ext_${node.ext}`;
    click = props.handleFileClick;
  } else {
    cN = "directory collapsed";
    click = props.handleOpen;
  }
  return (
    <ul className="jqueryFileTree">
      <li className={cN}>
        <a onClick={(e) => click(e, node.path)} href="#">
          {node.name}
        </a>
        {childNodes}
      </li>
    </ul>
  );
}

FileTree.propTypes = {
  node: PropTypes.shape({
    name: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    ext: PropTypes.string,
    childNodes: PropTypes.array,
  }),
  handleClose: PropTypes.func.isRequired,
  handleOpen: PropTypes.func.isRequired,
  handleFileClick: PropTypes.func.isRequired,
};

export default FileTree;
