import _ from "lodash";

import * as constants from "./constants";

const resultbrowserInitialState = {
  facets: null,
  files: [],
  selectedFacets: {},
  activeFacet: "results",
  metadata: {},
  loadingFacets: false
};

export const resultbrowserReducer = (state = resultbrowserInitialState, action) => {
  switch (action.type) {
    case constants.START_LOADING_RESULT_FACETS:
      return { ...state, loadingFacets: true };
    case constants.STOP_LOADING_RESULT_FACETS:
      return { ...state, loadingFacets: false };
    case constants.LOAD_RESULT_FACETS:
      return { ...state, facets: action.payload.data, loadingFacets: false };
    case constants.SELECT_RESULT_FACET: {
      const selectedFacets = { ...state.selectedFacets };
      selectedFacets[action.facet] = action.value;
      return { ...state, selectedFacets };
    }
    case constants.CLEAR_RESULT_FACET: {
      let newFacets = { ...state.selectedFacets };
      newFacets = _.omit(newFacets, action.facet);
      return { ...state, selectedFacets: newFacets };
    }
    case constants.CLEAR_ALL_RESULT_FACETS:
      return { ...state, selectedFacets: {} };
    case constants.SET_ACTIVE_RESULT_FACET:
      if (state.activeFacet === action.facet) {
        return { ...state, activeFacet: resultbrowserInitialState.activeFacet };
      }
      return { ...state, activeFacet: action.facet };
    case constants.SET_METADATA:
      return { ...state, metadata: action.metadata };
    default:
      return state;
  }
};


