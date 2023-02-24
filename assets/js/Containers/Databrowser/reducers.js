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
  fileLoading: false,
};

export const databrowserReducer = (state = databrowserInitialState, action) => {
  switch (action.type) {
    case constants.SET_FACET_LOADING:
      return { ...state, facetLoading: true };
    case constants.SET_FILE_LOADING:
      return { ...state, fileLoading: true };
    case constants.LOAD_FACETS:
      return {
        ...state,
        error: "",
        facets: action.payload.data,
        facetLoading: false,
      };
    case constants.UPDATE_FACET_SELECTION: {
      const { minDate, maxDate, dateSelector, ...queryObject } =
        action.queryObject;
      // let newObject = {}
      // if (state.facets) {
      //   Object.keys(state.facets).forEach(key => {
      //     if (key in queryObject) {
      //       newObject = { ...newObject, [key]: queryObject[key] };
      //     }
      //   });
      // }
      // let dateInfo = {};
      let myMinDate = minDate;
      let myMaxDate = maxDate;
      let myDateSelector = dateSelector;
      if (!dateSelector || !minDate || !maxDate) {
        myDateSelector = databrowserInitialState.dateSelector;
        myMinDate = databrowserInitialState.minDate;
        myMaxDate = databrowserInitialState.maxDate;
      }
      return {
        ...state,
        selectedFacets: { ...queryObject },
        dateSelector: myDateSelector,
        minDate: myMinDate,
        maxDate: myMaxDate,
      };
    }
    case constants.SET_METADATA:
      return { ...state, metadata: action.metadata };
    case constants.LOAD_FILES:
      return {
        ...state,
        files: action.payload.data,
        numFiles: action.payload.metadata.numFound,
        fileLoading: false,
      };
    case constants.LOAD_NCDUMP_ERROR:
      return { ...state, ncdumpStatus: "error", ncdumpError: action.message };
    case constants.LOAD_NCDUMP:
      return { ...state, ncdumpStatus: "loading" };
    case constants.LOAD_NCDUMP_SUCCESS:
      return {
        ...state,
        ncdumpStatus: "ready",
        ncdumpOutput: action.message,
        ncdumpError: null,
      };
    case constants.RESET_NCDUMP:
      return {
        ...state,
        ncdumpStatus: "pw",
        ncdumpOutput: null,
        ncdumpError: null,
      };
    default:
      return state;
  }
};
