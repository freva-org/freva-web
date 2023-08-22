import * as constants from "./constants";

const databrowserInitialState = {
  facets: null,
  files: [],
  numFiles: 0,
  start: 0,
  selectedFacets: {},
  minDate: "",
  maxDate: "",
  dateSelector: constants.TIME_RANGE_FLEXIBLE,
  metadata: {},
  facetLoading: false,
  fileLoading: false,
  flavours: ["freva"],
  selectedFlavour: constants.DEFAULT_FLAVOUR,
};

export const databrowserReducer = (state = databrowserInitialState, action) => {
  switch (action.type) {
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
      const { minDate, maxDate, dateSelector, start, flavour, ...queryObject } =
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
        start: start !== undefined ? parseInt(start) : 0,
        dateSelector: myDateSelector,
        minDate: myMinDate,
        maxDate: myMaxDate,
        selectedFlavour: flavour,
      };
    }
    case constants.SET_METADATA:
      return { ...state, metadata: action.metadata };
    case constants.SET_FLAVOURS:
      return { ...state, flavours: action.payload.flavours };
    case constants.LOAD_FILES:
      return {
        ...state,
        facets: action.payload.facets,
        primaryFacets: action.payload.primary_facets,
        facetMapping: action.payload.facet_mapping,
        files: action.payload.search_results.map((x) => x.file),
        numFiles: action.payload.total_count,
        fileLoading: false,
        start: parseInt(action.payload.start),
        selectedFlavour: action.payload.flavour,
      };
    default:
      return state;
  }
};
