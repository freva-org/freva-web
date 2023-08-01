import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Button, Form } from "react-bootstrap";

import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function Pagination(props) {
  const [active, setActive] = useState(props.active);

  useEffect(() => {
    setActive(props.active);
  }, [props]);

  function handleFieldChange(e) {
    setActive(Number(e.target.value));
  }

  function getPrevious() {
    return props.handleSubmit(props.active - 1);
  }

  function getNext() {
    console.log("next", props.active);
    return props.handleSubmit(props.active + 1);
  }

  function getPage(e) {
    if (e.key === "Enter") {
      const valid = active >= 1 && active <= props.items;
      if (valid) {
        props.handleSubmit(active);
      }
    }
  }

  const firstPage = 1;
  const lastPage = props.items;
  const activePage = props.active;
  const valid = active >= 1 && active <= lastPage;
  console.log("ACTIVE", active);
  return (
    <div className="d-flex justify-content-end">
      <Button
        variant="link"
        disabled={firstPage === activePage}
        onClick={getPrevious}
      >
        <FaChevronLeft className="intext-large-icon" />
      </Button>{" "}
      <React.Fragment>
        <Form.Control
          className="pagination-form"
          isInvalid={!valid}
          onChange={handleFieldChange}
          onKeyPress={getPage}
          min={1}
          max={lastPage}
          value={active}
        />{" "}
      </React.Fragment>
      <span className="m-2 me-0 text-nowrap">of {lastPage} </span>
      <Button
        variant="link"
        disabled={lastPage === activePage || props.items <= 0}
        onClick={getNext}
      >
        <FaChevronRight className="intext-large-icon" />
      </Button>
    </div>
  );
}

Pagination.propTypes = {
  items: PropTypes.number.isRequired,
  active: PropTypes.number.isRequired,
  handleSubmit: PropTypes.func.isRequired,
};
