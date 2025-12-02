import React from "react";
import PropTypes from "prop-types";

import { Badge } from "react-bootstrap";
import { FaTimes } from "react-icons/fa";

import { initCap, underscoreToBlank } from "../../utils";
import AccordionItemBody from "../../Components/AccordionItemBody";
import OwnPanel from "../../Components/OwnPanel";

/*
This class represents a single Dropdown Menu for a single facet including the title of the facet
*/
export function FacetPanel({
  value,
  keyVar,
  metadata,
  selectedFacets,
  facetMapping,
  clickFacet,
  clickFacetValue,
  isFacetCentered,
}) {
  const isFacetSelected = !!selectedFacets[keyVar];
  const facetTitle = initCap(underscoreToBlank(facetMapping[keyVar] ?? keyVar));
  let panelHeader;

  if (isFacetSelected) {
    const selectedValue = selectedFacets[keyVar];
    const valuesArray = Array.isArray(selectedValue)
      ? selectedValue
      : [selectedValue];

    panelHeader = (
      <span className="d-flex align-items-center flex-wrap gap-2">
        <span>{facetTitle}:</span>
        {valuesArray.map((v) => (
          <Badge
            key={v}
            bg=""
            style={{
              backgroundColor: window.MAIN_COLOR,
              cursor: "pointer",
              padding: "6px 10px",
              fontSize: "13px",
            }}
            onClick={(e) => {
              e.stopPropagation();
              clickFacetValue(keyVar, v);
            }}
          >
            {v}
            <FaTimes className="ms-1" style={{ fontSize: "10px" }} />
          </Badge>
        ))}
      </span>
    );
  } else if (value.length === 2) {
    panelHeader = (
      <span>
        {facetTitle}: <strong>{value[0]}</strong>
      </span>
    );
  } else {
    const numberOfValues = value.length / 2;
    panelHeader = (
      <span className="d-flex justify-content-between">
        <span>{facetTitle}</span>
        <Badge bg="secondary d-flex align-items-center">
          {numberOfValues.toLocaleString("en-US")}
        </Badge>
      </span>
    );
  }

  return (
    <OwnPanel header={panelHeader} key={keyVar} removeFacet={null}>
      <AccordionItemBody
        eventKey={keyVar}
        mappedName={facetTitle}
        value={value}
        isFacetCentered={isFacetCentered}
        facetClick={clickFacet}
        metadata={metadata[keyVar] ? metadata[keyVar] : null}
      />
    </OwnPanel>
  );
}

FacetPanel.propTypes = {
  value: PropTypes.array,
  keyVar: PropTypes.string,
  metadata: PropTypes.object,
  facetMapping: PropTypes.object,
  selectedFacets: PropTypes.object,
  isFacetCentered: PropTypes.bool,
  clickFacet: PropTypes.func.isRequired,
  clickFacetValue: PropTypes.func.isRequired,
};
