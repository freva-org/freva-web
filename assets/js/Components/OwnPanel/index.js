import React from "react";
import PropTypes from "prop-types";
import {Accordion, Button, Card, useAccordionButton} from "react-bootstrap";
import {FaTimes} from "react-icons/fa";

function CustomToggle ({ children, eventKey, collapse, removeFacet }) {
  const decoratedOnClick = useAccordionButton(eventKey, () => {
    collapse();
  }
  );

  const dropFacetAndCollapse = useAccordionButton(eventKey, () => {
    removeFacet();
    collapse();
  }
  );

  return (
    <React.Fragment>
      <Button
        type="button"
        variant="link"
        className="ps-0 pe-1"
        onClick={decoratedOnClick}
      >
        {children}
      </Button>
      {removeFacet ? <Button variant="link" className="link-danger p-0 lh-1" onClick={dropFacetAndCollapse}> <FaTimes /> </Button> : null}
    </React.Fragment>
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

function OwnPanel (props) {
  return (
    <Card className="my-3">
      <Card.Header>
        <CustomToggle eventKey={props.eventKey} collapse={props.collapse} removeFacet={props.removeFacet}> {props.header} </CustomToggle>
      </Card.Header>
      <Accordion.Collapse className="p-3" eventKey={props.eventKey}>
        {props.children}
      </Accordion.Collapse>
    </Card>
  );
}

export default OwnPanel;
