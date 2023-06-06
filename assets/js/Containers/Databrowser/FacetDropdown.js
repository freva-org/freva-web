import React from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import { Badge, Button } from "react-bootstrap";

import { FaTimes } from "react-icons/fa";

import Select from "../../Components/Select";
import { initCap, underscoreToBlank } from "../../utils";

function FacetDropdownImpl(props) {
  const options = [];
  for (const f in props.databrowser.facets) {
    const facet = props.databrowser.facets[f];
    const additionalInfo = props.databrowser.metadata[f];
    for (let i = 0; i < facet.length; i = i + 2) {
      const valueInfos = additionalInfo && additionalInfo[facet[i]];
      options.push({
        value: facet[i] + (valueInfos ? " " + valueInfos : ""),
        realValue: facet[i],
        category: f,
        label: (
          <div className="d-flex justify-content-between">
            <div>
              <Badge bg="primary">{initCap(underscoreToBlank(f))}</Badge>{" "}
              {facet[i]}
            </div>
            <Badge bg="secondary">{facet[i + 1]}</Badge>
          </div>
        ),
      });
    }
  }
  const values = Object.keys(props.databrowser.selectedFacets).map((x) => {
    return (
      <Button
        variant="secondary"
        className="me-2 badge"
        onClick={() => {
          props.dropFacet(x);
        }}
        key={"selected-" + x + props.databrowser.selectedFacets[x]}
      >
        {initCap(underscoreToBlank(x))}: {props.databrowser.selectedFacets[x]}
        <FaTimes className="ms-2 fs-6" />
      </Button>
    );
  });
  return (
    <div>
      <Select
        options={options}
        placeholder={"Search through all facets..."}
        onChange={(elem) => {
          props.clickFacet(elem.category, elem.realValue);
        }}
      />
      <div className="d-flex justify-content-start my-2">{values}</div>
    </div>
  );
}

FacetDropdownImpl.propTypes = {
  className: PropTypes.string,
  clickFacet: PropTypes.func.isRequired,
  dropFacet: PropTypes.func.isRequired,
  databrowser: PropTypes.shape({
    facets: PropTypes.object,
    files: PropTypes.array,
    fileLoading: PropTypes.bool,
    metadata: PropTypes.object,
    facetLoading: PropTypes.bool,
    numFiles: PropTypes.number,
    selectedFacets: PropTypes.object,
    dateSelector: PropTypes.string,
    minDate: PropTypes.string,
    maxDate: PropTypes.string,
  }),
};

const mapStateToProps = (state) => ({
  databrowser: state.databrowserReducer,
});

export default connect(mapStateToProps)(FacetDropdownImpl);
