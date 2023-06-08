import React from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import { Badge } from "react-bootstrap";

import Select from "../../Components/Select";
import { initCap, underscoreToBlank } from "../../utils";

function FacetDropdownImpl(props) {
  const options = [];

  function constructValueName(category, value) {
    const additionalInfo = props.metadata[category];
    const valueInfos = additionalInfo && additionalInfo[value];
    return value + (valueInfos ? " " + valueInfos : "");
  }

  for (const f in props.facets) {
    const facet = props.facets[f];
    for (let i = 0; i < facet.length; i = i + 2) {
      options.push({
        value: constructValueName(f, facet[i]),
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

  function getSelectedValues() {
    return Object.keys(props.selectedFacets).map((key) => {
      return { value: constructValueName(key, props.selectedFacets[key]) };
    });
  }

  return (
    <div className="mb-3 shadow-sm">
      <Select
        options={options}
        placeholder={"Search through all facets..."}
        value={getSelectedValues()}
        onChange={(elem) => {
          console.log("fooo");
          props.clickFacet(elem.category, elem.realValue);
        }}
      />
    </div>
  );
}

FacetDropdownImpl.propTypes = {
  className: PropTypes.string,
  clickFacet: PropTypes.func.isRequired,
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
