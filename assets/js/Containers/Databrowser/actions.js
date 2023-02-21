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

export const resetNcdump = () => ({
  type: constants.RESET_NCDUMP,
});

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
      let operator;
      if (queryObject.dateSelector === constants.TIME_RANGE_FLEXIBLE) {
        operator = "Intersects";
      } else if (queryObject.dateSelector === constants.TIME_RANGE_STRICT) {
        operator = "Within";
      } else {
        operator = "Contains";
      }
      params += `&time_select=${operator}&time=${queryObject.minDate} TO ${queryObject.maxDate}`;
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
    .then((response) => response.json())
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

export const loadNcdump = (fn, pw) => (dispatch) => {
  const url = "/api/solr/ncdump/";
  dispatch({ type: constants.LOAD_NCDUMP, fn });
  return fetch(url, {
    credentials: "same-origin",
    method: "POST",
    headers: {
      "X-CSRFToken": getCookie("csrftoken"),
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      file: fn,
      pass: pw,
    }),
  })
    .then((resp) => {
      if (!resp.ok) {
        /* eslint-disable */
        return resp.json().then((json) => {
          console.log(resp.statusText);
          if (json.error_msg) {
            throw new Error(json.error_msg);
          } else {
            throw new Error(resp.statusText);
          }
        });
      }
      return resp.json();
    })
    .then((json) => {
      return dispatch({
        type: constants.LOAD_NCDUMP_SUCCESS,
        message: json.ncdump,
      });
    })
    .catch((error) => {
      dispatch({ type: constants.LOAD_NCDUMP_ERROR, message: error.message });
    });
};
