import React from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import { Badge } from "react-bootstrap";

import Select from "../../Components/Select";
import { initCap, underscoreToBlank } from "../../utils";

function FacetDropdownImpl(props) {
  const options = [];
  for (const f in props.facets) {
    const facet = props.facets[f];
    const additionalInfo = props.metadata[f];
    for (let i = 0; i < facet.length; i = i + 2) {
      const valueInfos = additionalInfo && additionalInfo[facet[i]];
      options.push({
        value: facet[i] + (valueInfos ? " " + valueInfos : ""),
        realValue: facet[i],
        category: f,
        label: (
          <div className="d-flex justify-content-between">
            <div className="text-truncate">
              <Badge bg="primary">{initCap(underscoreToBlank(f))}</Badge>{" "}
              {facet[i]}
            </div>
            <Badge bg="secondary">{facet[i + 1]}</Badge>
          </div>
        ),
      });
    }
  }

  return (
    <div className="mb-3 shadow-sm">
      <Select
        options={options}
        placeholder={"Search through all facets..."}
        onChange={(elem) => {
          props.clickFacet(elem.category, elem.realValue);
        }}
      />
    </div>
  );
}

FacetDropdownImpl.propTypes = {
  className: PropTypes.string,
  clickFacet: PropTypes.func.isRequired,
  dropFacet: PropTypes.func.isRequired,
  facets: PropTypes.object,
  metadata: PropTypes.object,
  selectedFacets: PropTypes.object,
};

const mapStateToProps = (state) => ({
  facets: state.databrowserReducer.facets,
  metadata: state.databrowserReducer.metadata,
  selectedFacets: state.databrowserReducer.selectedFacets,
});

export default connect(mapStateToProps)(FacetDropdownImpl);
