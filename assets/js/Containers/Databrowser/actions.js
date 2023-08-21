import fetch from "isomorphic-fetch";

import { getCookie } from "../../utils";

import * as globalStateConstants from "../App/constants";

import * as constants from "./constants";
import { prepareSearchParams } from "./utils";

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

export const setFlavours = () => (dispatch) => {
  return fetch("/api/databrowser/overview", {
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
    `max-results=${constants.BATCH_SIZE}&translate=false`,
    constants.LOAD_FILES
  );
};

function fetchResults(dispatch, location, additionalParams, actionType) {
  const searchParams = prepareSearchParams(location, additionalParams);
  const url = `/api/databrowser/extended-search/${searchParams}`;
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
        payload: {
          ...json,
          start: location.query.start ?? 0,
          flavour: location.query.flavour ?? constants.DEFAULT_FLAVOUR,
        },
      });
    })
    .catch(() => {
      return dispatch({
        type: globalStateConstants.SET_ERROR,
        payload: "Internal Error: Could not load results",
      });
    });
}
