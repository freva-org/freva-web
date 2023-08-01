import fetch from "isomorphic-fetch";

import queryString from "query-string";

import { getCookie } from "../../utils";

import * as globalStateConstants from "../App/constants";

import * as constants from "./constants";

export const updateFacetSelection = (queryObject) => (dispatch) => {
  dispatch({
    type: constants.UPDATE_FACET_SELECTION,
    queryObject,
  });
};

export const setMetadata = (metadata) => ({
  type: constants.SET_METADATA,
  metadata,
});

// export const loadFacets = (location) => (dispatch) => {
//   dispatch({ type: constants.SET_FACET_LOADING });
//   return fetchResults(dispatch, location, "facet=*", constants.LOAD_FACETS);
// };

export const setFlavours = () => (dispatch) => {
  return fetch("/solr/overview", {
    credentials: "same-origin",
    headers: {
      "X-CSRFToken": getCookie("csrftoken"),
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (response.status >= 400) {
        throw new Error(response.statusText);
      }
      return response.json();
    })
    .then((json) => {
      return dispatch({
        type: constants.SET_FLAVOURS,
        payload: json,
      });
    })
    .catch(() => {
      return dispatch({
        type: globalStateConstants.SET_ERROR,
        payload: "Internal Error: Could not load flavours",
      });
    });
};

export const loadFiles = (location) => (dispatch) => {
  dispatch({ type: constants.SET_FILE_LOADING });
  return fetchResults(
    dispatch,
    location,
    "batch_size=100",
    constants.LOAD_FILES
  );
};

function fetchResults(dispatch, location, additionalParams, actionType) {
  // const { selectedFacets, dateSelector, minDate, maxDate } = getState().databrowserReducer;
  let params = "";
  if (location) {
    const queryObject = location.query;
    const { dateSelector, minDate, maxDate, ...facets } = queryObject;

    params = queryString.stringify(facets);

    if (params) {
      params = "&" + params;
    }

    const isDateSelected = !!minDate;
    if (isDateSelected) {
      params += `&time_select=${dateSelector}&time=${minDate} TO ${maxDate}`;
    }
  }

  const url = `/solr/search/freva/file?${additionalParams}${params}`;
  console.log("FETCH RESULTS", location.query.start);
  return fetch(url, {
    credentials: "same-origin",
    headers: {
      "X-CSRFToken": getCookie("csrftoken"),
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (response.status >= 400) {
        throw new Error(response.statusText);
      }
      return response.json();
    })
    .then((json) => {
      return dispatch({
        type: actionType,
        payload: { ...json, start: location.query.start ?? 0 },
      });
    })
    .catch(() => {
      return dispatch({
        type: globalStateConstants.SET_ERROR,
        payload: "Internal Error: Could not load results",
      });
    });
}
