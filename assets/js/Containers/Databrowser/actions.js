import fetch from "isomorphic-fetch";

import { getCookie } from "../../utils";

import * as globalStateConstants from "../App/constants";

import * as constants from "./constants";

export const selectFacet = (facet, value) => dispatch => {
  dispatch({
    type: constants.SELECT_FACET,
    facet,
    value
  });
  dispatch(loadFacets());
  dispatch(loadFiles());
};

export const clearFacet = (facet) => dispatch => {
  dispatch({
    type: constants.CLEAR_FACET,
    facet
  });
  dispatch(loadFacets());
  dispatch(loadFiles());
};

export const resetNcdump = () => ({
  type: constants.RESET_NCDUMP
});

export const setTimeRange = (timeRange) => dispatch => {
  dispatch({
    type: constants.SET_TIME_RANGE,
    timeRange
  });
  dispatch(loadFacets());
  dispatch(loadFiles());
};

export const clearTimeRange = () => dispatch => {
  dispatch({
    type: constants.CLEAR_TIME_RANGE
  });
  dispatch(loadFacets());
  dispatch(loadFiles());
};

export const setMetadata = (metadata) => ({
  type: constants.SET_METADATA,
  metadata
});

export const clearAllFacets = (facet) => dispatch => {
  dispatch({
    type: constants.CLEAR_ALL_FACETS,
    facet
  });
  dispatch(loadFacets());
  dispatch(loadFiles());
};

export const loadFacets = () => (dispatch, getState) => {
  dispatch({ type: constants.SET_FACET_LOADING });
  return fetchResults(dispatch, getState, "facet=*", constants.LOAD_FACETS);
};

export const loadFiles = () => (dispatch, getState) => {
  dispatch({ type: constants.SET_FILE_LOADING });
  return fetchResults(dispatch, getState, "start=0&rows=100", constants.LOAD_FILES);
};

function fetchResults (dispatch, getState, additionalParams, actionType) {
  const { selectedFacets, dateSelector, minDate, maxDate } = getState().databrowserReducer;
  let params = "";
  Object.keys(selectedFacets).forEach(key => {
    const value = selectedFacets[key];
    params += `&${key}=${value}`;
  });

  const isDateSelected = !!minDate;
  if (isDateSelected) {
    let operator;
    if (dateSelector === constants.TIME_RANGE_FLEXIBLE) {
      operator = "Intersects";
    } else if (dateSelector === constants.TIME_RANGE_STRICT) {
      operator = "Within";
    } else {
      operator = "Contains";
    }
    params += `&time_select=${operator}&time=${minDate} TO ${maxDate}`;
  }

  const url = `/solr/solr-search/?${additionalParams}${params}`;

  return fetch(url, {
    credentials: "same-origin",
    headers: {
      "X-CSRFToken": getCookie("csrftoken"),
      "Accept": "application/json",
      "Content-Type": "application/json"
    }
  }).then(response => response.json())
    .then(json => {
      return dispatch({
        type: actionType,
        payload: json
      });
    })
    .catch(() => {
      return dispatch({
        type: globalStateConstants.SET_ERROR,
        payload: "Internal Error: Could not load results"
      });
    });
}

export const loadNcdump = (fn, pw) => dispatch => {
  const url = "/api/solr/ncdump/";
  dispatch({ type: constants.LOAD_NCDUMP, fn });
  return fetch(url, {
    credentials: "same-origin",
    method: "POST",
    headers: {
      "X-CSRFToken": getCookie("csrftoken"),
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      file: fn,
      pass: pw
    })
  }).then(resp => {
    if (!resp.ok) {
      /* eslint-disable */
      return resp.json().then(json => {
        console.log(resp.statusText)
        if (json.error_msg) {
          throw new Error(json.error_msg);
        } else {
          throw new Error(resp.statusText);
        }
      });
    }
    return resp.json();
  }).then(json => {
    return dispatch({ type: constants.LOAD_NCDUMP_SUCCESS, message: json.ncdump });
  }
  ).catch((error) => {
    dispatch({ type: constants.LOAD_NCDUMP_ERROR, message: error.message });
  });
};