import React, { useState, useRef } from "react";
import PropTypes from "prop-types";
import { Collapse, Button, Card, Spinner } from "react-bootstrap";
import { FaTimes } from "react-icons/fa";

function OwnPanel(props) {
  const [open, setOpen] = useState(props.isOpen);
  const elemRef = useRef();
  function dropFacetAndCollapse(e) {
    e.stopPropagation();
    props.removeFacet();
  }

  function togglePanel() {
    setOpen(!open);
  }

  const childrenWithProps = React.Children.map(props.children, (child) => {
    if (React.isValidElement(child) && child.type !== "div") {
      return React.cloneElement(child, { togglePanel, elemRef });
    }
    return child;
  });

  return (
    <Card className="mb-3 shadow-sm">
      <div
        className="btn btn-outline-secondary border-0 p-3 rounded-top text-start card-header shadow-sm button-div"
        onClick={() => setOpen(!open)}
      >
        <div
          ref={elemRef}
          style={{
            visibility: "visible",
            whiteSpace: "normal",
            width: "calc(100% - " + getScrollbarWidth() + "px)",
          }}
        />
        {props.header}
        {props.loading && (
          <Spinner animation="border" className="mx-2" size="sm" />
        )}
        {props.removeFacet ? (
          <Button
            variant="danger"
            className="icon-btn rounded-circle m-1 mt-0 lh-1"
            onClick={dropFacetAndCollapse}
          >
            <FaTimes />
          </Button>
        ) : null}
      </div>
      <Collapse in={open} className="p-3 py-2">
        <div>{childrenWithProps}</div>
      </Collapse>
    </Card>
  );
}

/*
 * This function calculates the width of the scroll of the browser in use.
 * It is needed for calculating the proper dimensions of each single facet
 * value.
 */
function getScrollbarWidth() {
  // Creating invisible container
  const outer = document.createElement("div");
  outer.style.visibility = "hidden";
  outer.style.overflowY = "scroll"; // forcing scrollbar to appear
  outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps
  document.body.appendChild(outer);

  // Creating inner element and placing it in the container
  const inner = document.createElement("div");
  outer.appendChild(inner);

  // Calculating difference between container's full width and the child width
  const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;

  // Removing temporary elements from the DOM
  outer.parentNode.removeChild(outer);

  return scrollbarWidth;
}

OwnPanel.propTypes = {
  header: PropTypes.node.isRequired,
  isFacetSelected: PropTypes.bool,
  removeFacet: PropTypes.func,
  children: PropTypes.node,
  isOpen: PropTypes.bool,
  loading: PropTypes.bool,
};

export default OwnPanel;
