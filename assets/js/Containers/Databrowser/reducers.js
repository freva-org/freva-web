import _ from "lodash";

import * as constants from "./constants";

const databrowserInitialState = {
  facets: null,
  files: [],
  numFiles: 0,
  selectedFacets: {},
  minDate: "",
  maxDate: "",
  dateSelector: constants.TIME_RANGE_FLEXIBLE,
  metadata: {},
  ncdumpStatus: "pw",
  ncdumpOutput: null,
  ncdumpError: null,
  facetLoading: false,
  fileLoading: false
};

export const databrowserReducer = (state = databrowserInitialState, action) => {
  switch (action.type) {
    case constants.SET_FACET_LOADING:
      return { ...state, facetLoading: true };
    case constants.SET_FILE_LOADING:
      return { ...state, fileLoading: true };
    case constants.LOAD_FACETS:
      return { ...state, error: "", facets: action.payload.data, facetLoading: false };
    case constants.SELECT_FACET: {
      const selectedFacets = { ...state.selectedFacets };
      selectedFacets[action.facet] = action.value;
      return { ...state, selectedFacets };
    }
    case constants.CLEAR_FACET: {
      let newFacets = { ...state.selectedFacets };
      newFacets = _.omit(newFacets, action.facet);
      return { ...state, selectedFacets: newFacets };
    }
    case constants.CLEAR_ALL_FACETS:
      return {
        ...state,
        selectedFacets: {},
        dateSelector: databrowserInitialState.dateSelector,
        minDate: databrowserInitialState.minDate,
        maxDate: databrowserInitialState.maxDate
      };
    case constants.SET_METADATA:
      return { ...state, metadata: action.metadata };
    case constants.LOAD_FILES:
      return { ...state, files: action.payload.data, numFiles: action.payload.metadata.numFound, fileLoading: false };
    case constants.LOAD_NCDUMP_ERROR:
      return { ...state, ncdumpStatus: "error", ncdumpError:  action.message };
    case constants.LOAD_NCDUMP:
      return { ...state, ncdumpStatus: "loading" };
    case constants.LOAD_NCDUMP_SUCCESS:
      return { ...state, ncdumpStatus: "ready", ncdumpOutput: action.message, ncdumpError: null };
    case constants.SET_TIME_RANGE:
      return { ...state, dateSelector: action.timeRange.dateSelector, minDate: action.timeRange.minDate, maxDate: action.timeRange.maxDate };
    case constants.CLEAR_TIME_RANGE:
      return {
        ...state,
        dateSelector: databrowserInitialState.dateSelector,
        minDate: databrowserInitialState.minDate,
        maxDate: databrowserInitialState.maxDate
      };
    case constants.RESET_NCDUMP:
      return { ...state, ncdumpStatus: "pw", ncdumpOutput: null, ncdumpError: null };
    default:
      return state;
  }
};