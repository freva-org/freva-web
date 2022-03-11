import React from "react";
import PropTypes from "prop-types";
import { Accordion, Button, Card, useAccordionButton } from "react-bootstrap";
import { FaTimes } from "react-icons/fa";

function OwnPanel (props) {
  const decoratedOnClick = useAccordionButton(props.eventKey, () => {
    props.collapse();
  });

  const dropFacetAndCollapse = useAccordionButton(props.eventKey, () => {
    props.removeFacet();
    props.collapse();
  });

  return (
    <Card className="my-3 shadow-sm">
      <div
        className="btn btn-outline-secondary border-0 p-3 rounded-top text-start card-header shadow-sm button-div"
        onClick={decoratedOnClick}
      >
        {props.header}
        {
          props.removeFacet ?
            <Button
              variant="danger"
              className="icon-btn rounded-circle ms-1 lh-1"
              onClick={dropFacetAndCollapse}
            >
              <FaTimes />
            </Button> :
            null
        }
      </div>
      <Accordion.Collapse className="p-3" eventKey={props.eventKey}>
        {props.children}
      </Accordion.Collapse>
    </Card>
  );
}

OwnPanel.propTypes = {
  collapse: PropTypes.func.isRequired,
  header: PropTypes.node.isRequired,
  eventKey: PropTypes.string.isRequired,
  isFacetSelected: PropTypes.bool,
  removeFacet: PropTypes.func,
  children: PropTypes.node
};

export default OwnPanel;
