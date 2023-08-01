import React from "react";
import PropTypes from "prop-types";

import { Badge } from "react-bootstrap";

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
  isFacetCentered,
}) {
  const isFacetSelected = !!selectedFacets[keyVar];
  const facetTitle = initCap(underscoreToBlank(facetMapping[keyVar] ?? keyVar));
  let panelHeader;
  if (isFacetSelected) {
    panelHeader = (
      <span>
        {facetTitle}: <strong>{selectedFacets[keyVar]}</strong>
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
        <Badge bg="secondary d-flex align-items-center">{numberOfValues}</Badge>
      </span>
    );
  }
  return (
    <OwnPanel
      header={panelHeader}
      key={keyVar}
      removeFacet={isFacetSelected ? () => this.clickFacet(keyVar) : null}
    >
      <AccordionItemBody
        eventKey={keyVar}
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
};
