import React from "react";
import PropTypes from "prop-types";
import { Spinner } from "react-bootstrap";

export default function CircularSpinner ({ outerClassName }) {
  const className = outerClassName ? outerClassName : "text-center";
  return (
    <div className={className}>
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    </div>
  );
}

CircularSpinner.propTypes = {
  outerClassName:PropTypes.string
};