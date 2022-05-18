import fetch from "isomorphic-fetch";
import _ from "lodash";

import { getCookie } from "../../utils";

import * as globalStateConstants from "../App/constants";

import * as constants from "./constants";

export const selectFacet = (facet, value) => dispatch => {
  setTimeout(function () {
    dispatch({
      type: constants.SELECT_FACET,
      facet,
      value
    });
    dispatch(setActiveFacet(facet));
    dispatch(loadFacets());
    dispatch(loadFiles());
  },50);

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

export const setActiveFacet = (facet) => ({
  type: constants.SET_ACTIVE_FACET,
  facet
});

export const loadFacets = () => (dispatch, getState) => {

  const { selectedFacets } = getState().databrowserReducer;
  let params = "";
  _.map(selectedFacets, (value, key) => {
    params += `&${key}=${value}`;
  });
  const url = `/solr/solr-search/?facet=*${params}`;

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
        type: constants.LOAD_FACETS,
        payload: json
      });
    })
    .catch(() => {
      return dispatch({
        type: globalStateConstants.SET_ERROR,
        payload: "Internal Error: Could not load results"
      });
    });
};

export const loadFiles = () => (dispatch, getState) => {

  const { selectedFacets } = getState().databrowserReducer;
  let params = "";
  _.map(selectedFacets, (value, key) => {
    params += `&${key}=${value}`;
  });
  const url = `/solr/solr-search/?start=0&rows=100${params}`;

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
        type: constants.LOAD_FILES,
        payload: json
      });
    })
    .catch(() => {
      return dispatch({
        type: globalStateConstants.SET_ERROR,
        payload: "Internal Error: Could not load results"
      });
    });
};

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