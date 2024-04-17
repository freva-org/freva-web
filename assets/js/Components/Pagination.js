import React from "react";
import PropTypes from "prop-types";
import { Button } from "react-bootstrap";

import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function Pagination(props) {
  function getPrevious() {
    return props.handleSubmit(props.active - 1);
  }

  function getNext() {
    return props.handleSubmit(props.active + 1);
  }

  const firstPage = 1;
  const lastPage = props.items;
  const activePage = props.active;
  const totalFiles = props.totalFiles;
  const batchSize = props.batchSize;

  // const valid = active >= 1 && active <= lastPage;
  return (
    <div className="d-flex justify-content-end">
      <Button
        className="p-0 d-flex align-items-center"
        variant="link"
        disabled={firstPage === activePage}
        onClick={getPrevious}
      >
        <FaChevronLeft className="intext-large-icon" />
      </Button>
      <span className="m-2 text-nowrap">
        Showing:{" "}
        <span className="fw-bold">
          {((activePage - 1) * batchSize + 1).toLocaleString("en-US")}
        </span>{" "}
        to
        <span className="fw-bold">
          {" "}
          {Math.min(totalFiles, activePage * batchSize).toLocaleString("en-US")}
        </span>
        {" of "}
        <span className="fw-bold">
          {totalFiles.toLocaleString("en-US")}
        </span>{" "}
      </span>
      <Button
        className="p-0 d-flex align-items-center"
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
  totalFiles: PropTypes.string.isRequired,
  batchSize: PropTypes.number.isRequired,
};
