import React, { useState } from "react";
import PropTypes from "prop-types";
import { Collapse, Button, Card, Spinner } from "react-bootstrap";
import { FaTimes } from "react-icons/fa";

function OwnPanel (props) {
  const [open, setOpen] = useState(props.isOpen);

  function dropFacetAndCollapse (e) {
    e.stopPropagation();
    props.removeFacet();
  }

  function togglePanel () {
    setOpen(!open);
  }

  const childrenWithProps = React.Children.map(props.children, child => {
    if (React.isValidElement(child) && child.type !== "div") {
      return React.cloneElement(child, { togglePanel });
    }
    return child;
  });

  return (
    <Card className="mb-3 shadow-sm">
      <div
        className="btn btn-outline-secondary border-0 p-3 rounded-top text-start card-header shadow-sm button-div"
        onClick={() => setOpen(!open)}
      >
        {props.header}
        {props.loading && <Spinner animation="border" className="mx-2" size="sm" />}
        {
          props.removeFacet ?
            <Button
              variant="danger"
              className="icon-btn rounded-circle m-1 mt-0 lh-1"
              onClick={dropFacetAndCollapse}
            >
              <FaTimes />
            </Button> :
            null
        }
      </div>
      <Collapse in={open} className="p-3">
        <div>
          {childrenWithProps}
        </div>
      </Collapse>
    </Card>
  );
}

OwnPanel.propTypes = {
  header: PropTypes.node.isRequired,
  isFacetSelected: PropTypes.bool,
  removeFacet: PropTypes.func,
  children: PropTypes.node,
  isOpen: PropTypes.bool,
  loading: PropTypes.bool
};

export default OwnPanel;
