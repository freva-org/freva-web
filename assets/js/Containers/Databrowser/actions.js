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

export const loadFacets = (location) => (dispatch) => {
  dispatch({ type: constants.SET_FACET_LOADING });
  return fetchResults(dispatch, location, "facet=*", constants.LOAD_FACETS);
};

export const loadFiles = (location) => (dispatch) => {
  dispatch({ type: constants.SET_FILE_LOADING });
  return fetchResults(
    dispatch,
    location,
    "start=0&rows=100",
    constants.LOAD_FILES
  );
};

function fetchResults(dispatch, location, additionalParams, actionType) {
  // const { selectedFacets, dateSelector, minDate, maxDate } = getState().databrowserReducer;
  let params = "";
  if (location) {
    const queryObject = location.query;
    const {
      dateSelector: ignore1,
      minDate: ignore2,
      maxDate: ignore3,
      ...facets
    } = location.query;

    params = queryString.stringify(facets);

    if (params) {
      params = "&" + params;
    }

    const isDateSelected = !!queryObject.minDate;
    if (isDateSelected) {
      params += `&time_select=${queryObject.dateSelector}&time=${queryObject.minDate} TO ${queryObject.maxDate}`;
    }
  }

  const url = `/solr/solr-search/?${additionalParams}${params}`;

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
        payload: json,
      });
    })
    .catch(() => {
      return dispatch({
        type: globalStateConstants.SET_ERROR,
        payload: "Internal Error: Could not load results",
      });
    });
}
