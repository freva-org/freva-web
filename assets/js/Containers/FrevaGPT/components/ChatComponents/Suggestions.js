import React from "react";

import { Button, Tooltip, OverlayTrigger } from "react-bootstrap";

import PropTypes from "prop-types";

import { botSuggestions } from "../../constants";

import { truncate } from "../../utils";

function Suggestions({ handleSubmit }) {
  return (
    <>
      {botSuggestions.map((element) => {
        return (
          <div key={`${element}-div`} className="col-md-3 mb-2">
            <OverlayTrigger
              key={`${element}-tooltip`}
              overlay={<Tooltip>{element}</Tooltip>}
            >
              <Button
                className="h-100 w-100"
                variant="outline-secondary"
                onClick={() => handleSubmit(element)}
              >
                {truncate(element)}
              </Button>
            </OverlayTrigger>
          </div>
        );
      })}
    </>
  );
}

Suggestions.propTypes = {
  handleSubmit: PropTypes.func,
};

export default Suggestions;
