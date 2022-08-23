import fetch from "isomorphic-fetch";
import _ from "lodash";

import { getCookie } from "../../utils";

import * as globalStateConstants from "../App/constants";

import * as constants from "./constants";

export const selectResultFacet = (facet, value) => dispatch => {
  setTimeout(function () {
    dispatch({
      type: constants.SELECT_RESULT_FACET,
      facet,
      value
    });
    dispatch(loadResultFacets());
  },50);

};

export const clearResultFacet = (facet) => dispatch => {
  dispatch({
    type: constants.CLEAR_RESULT_FACET,
    facet
  });
  dispatch(loadResultFacets());
};


export const setMetadata = (metadata) => ({
  type: constants.SET_METADATA,
  metadata
});

export const clearAllResultFacets = (facet) => dispatch => {
  dispatch({
    type: constants.CLEAR_ALL_RESULT_FACETS,
    facet
  });
  dispatch(loadResultFacets());
};

export const loadResultFacets = () => (dispatch, getState) => {

  const { selectedFacets } = getState().resultbrowserReducer;
  let params = "";
  _.map(selectedFacets, (value, key) => {
    params += `&${key}=${value}`;
  });
  const url = `/api/history/result-browser/?${params}`;

  return new Promise((resolve) => {
    return resolve(dispatch({ type: constants.START_LOADING_RESULT_FACETS }));
  })
    .then(() => {
      return fetch(url, {
        credentials: "same-origin",
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      });
    }
    ).then(response => response.json())
    .then(json => {
      return dispatch({
        type: constants.LOAD_RESULT_FACETS,
        payload: json
      });
    })
    .catch(() => {
      dispatch({ type: constants.STOP_LOADING_RESULT_FACETS });
      return dispatch({
        type: globalStateConstants.SET_ERROR,
        payload: "Internal Error: Could not load results"
      });
    });
};