import React from "react";
import PropTypes from "prop-types";

function ReferenceItem({ link, title }) {
  return (
    <span
      className="color bot-shadow br-8 bot-references me-1 bot-bg-lg"
      role="button"
    >
      <a href={link ? link : ""}>{title}</a>
    </span>
  );
}

ReferenceItem.propTypes = {
  link: PropTypes.string,
  title: PropTypes.string,
};

export default ReferenceItem;
