import React from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import { Badge } from "react-bootstrap";

import Select from "../../Components/Select";
import { initCap, underscoreToBlank } from "../../utils";

function MetaFacetImpl(props) {
  const options = [];

  function constructValueName(category, value) {
    const additionalInfo = props.metadata[category];
    const valueInfos = additionalInfo && additionalInfo[value];
    return value + (valueInfos ? " " + valueInfos : "");
  }
  const primaryFacetsSets = new Set(props.primaryFacets);
  const sortedFacets = [
    ...props.primaryFacets,
    ...Object.keys(props.facetMapping).filter((x) => !primaryFacetsSets.has(x)),
  ];

  for (const f of sortedFacets) {
    const facet = props.facets[f];
    if (!facet) {
      continue;
    }
    for (let i = 0; i < facet.length; i = i + 2) {
      options.push({
        value: constructValueName(f, facet[i]),
        realValue: facet[i],
        category: f,
        label: (
          <div className="d-flex justify-content-between">
            <div className="text-truncate">
              <Badge bg="primary">
                {initCap(underscoreToBlank(props.facetMapping[f]))}
              </Badge>{" "}
              {facet[i]}
            </div>
            <Badge bg="secondary">
              {parseInt(facet[i + 1]).toLocaleString("en-US")}
            </Badge>
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
    <Select
      options={options}
      placeholder={"Search through all facets..."}
      value={getSelectedValues()}
      onChange={(elem) => {
        props.clickFacet(elem.category, elem.realValue);
      }}
    />
  );
}

MetaFacetImpl.propTypes = {
  className: PropTypes.string,
  clickFacet: PropTypes.func.isRequired,
  facets: PropTypes.object,
  metadata: PropTypes.object,
  selectedFacets: PropTypes.object,
  primaryFacets: PropTypes.array,
  facetMapping: PropTypes.object,
};

const mapStateToProps = (state) => ({
  facets: state.databrowserReducer.facets,
  metadata: state.databrowserReducer.metadata,
  primaryFacets: state.databrowserReducer.primaryFacets,
  facetMapping: state.databrowserReducer.facetMapping,
  selectedFacets: state.databrowserReducer.selectedFacets,
});

export default connect(mapStateToProps)(MetaFacetImpl);
