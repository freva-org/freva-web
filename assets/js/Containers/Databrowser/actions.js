import fetch from "isomorphic-fetch";

import { getCookie } from "../../utils";

import * as globalStateConstants from "../App/constants";

import * as constants from "./constants";
import { prepareSearchParams } from "./utils";

const getTokenFromCookie = () => {
  const cookieString = document.cookie;
  const hasAuthCookie = cookieString.includes("freva_auth_token=");

  if (!hasAuthCookie) {
    return null;
  }
  try {
    const startIndex = cookieString.indexOf("freva_auth_token=");
    let cookieValue = cookieString.substring(
      startIndex + "freva_auth_token=".length
    );
    const semicolonIndex = cookieValue.indexOf(";");
    if (semicolonIndex !== -1) {
      cookieValue = cookieValue.substring(0, semicolonIndex);
    }
    if (cookieValue.startsWith('"') && cookieValue.endsWith('"')) {
      cookieValue = cookieValue.slice(1, -1);
    }
    const decodedJson = atob(cookieValue);
    const tokenData = JSON.parse(decodedJson);
    return tokenData;
  } catch (error) {
    return null;
  }
};

const getAuthHeaders = () => {
  const tokenData = getTokenFromCookie();
  const csrfToken = getCookie("csrftoken");
  const headers = {
    "X-CSRFToken": csrfToken,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (tokenData?.access_token) {
    headers.Authorization = `Bearer ${tokenData.access_token}`;
  }
  return headers;
};

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

export const setFlavours = () => async (dispatch) => {
  return fetch("/api/freva-nextgen/databrowser/flavours", {
    credentials: "same-origin",
    headers: getAuthHeaders(),
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

export const addFlavour = (flavourData) => async (dispatch) => {
  const response = await fetch("/api/freva-nextgen/databrowser/flavours", {
    method: "POST",
    credentials: "same-origin",
    headers: getAuthHeaders(),
    body: JSON.stringify(flavourData),
  });

  if (response.status >= 400) {
    const err = await response.json();
    if (response.status === 403) {
      throw new Error(
        err.detail || "You don't have permission to add flavours"
      );
    } else if (response.status === 409) {
      throw new Error(err.detail || "A flavour with this name already exists");
    } else if (response.status === 400) {
      throw new Error(err.detail || "Invalid flavour data provided");
    }
    throw new Error(err.detail || "Failed to add flavour");
  }

  const result = await response.json();
  await dispatch(setFlavours());
  return result;
};

export const deleteFlavour =
  (flavourName, isGlobal = false) =>
  async (dispatch) => {
    const url = `/api/freva-nextgen/databrowser/flavours/${encodeURIComponent(flavourName)}/${isGlobal ? "?is_global=true" : "?is_global=false"}`;

    const response = await fetch(url, {
      method: "DELETE",
      credentials: "same-origin",
      headers: getAuthHeaders(),
    });

    if (response.status >= 400) {
      const err = await response.json();
      if (response.status === 403) {
        throw new Error(
          err.detail || "You don't have permission to delete this flavour"
        );
      } else if (response.status === 404) {
        throw new Error(err.detail || "Flavour not found");
      } else if (response.status === 409) {
        throw new Error(err.detail || "Cannot delete built-in flavour");
      }
      throw new Error(err.detail || "Failed to delete flavour");
    }

    const result = await response.json();
    await dispatch(setFlavours());
    return result;
  };

export const loadFiles = (location) => async (dispatch) => {
  dispatch({ type: constants.SET_FILE_LOADING });
  return fetchResults(
    dispatch,
    location,
    `max-results=${constants.BATCH_SIZE}&translate=false`,
    constants.LOAD_FILES
  );
};

async function fetchResults(dispatch, location, additionalParams, actionType) {
  const searchParams = prepareSearchParams(location, additionalParams);
  const url = `/api/freva-nextgen/databrowser/extended-search/${searchParams}`;

  try {
    const headers = getAuthHeaders();

    const response = await fetch(url, {
      credentials: "same-origin",
      headers,
    });

    if (response.status >= 400) {
      if (response.status === 403) {
        throw new Error("Access denied. Please check your permissions.");
      } else if (response.status === 404) {
        throw new Error("Search endpoint not found.");
      }
      throw new Error(response.statusText);
    }

    const json = await response.json();
    return dispatch({
      type: actionType,
      payload: {
        ...json,
        start: location.query.start ?? 0,
        flavour: location.query.flavour ?? constants.DEFAULT_FLAVOUR,
      },
    });
  } catch (error) {
    let errorMessage = "Internal Error: Could not load results";

    if (error.message.includes("Access denied")) {
      errorMessage = "Access denied. Please check your authentication.";
    } else if (error.message.includes("not found")) {
      errorMessage = "Service temporarily unavailable. Please try again later.";
    } else if (error.message.includes("Failed to fetch")) {
      errorMessage = "Network error. Please check your connection.";
    }

    return dispatch({
      type: globalStateConstants.SET_ERROR,
      payload: errorMessage,
    });
  }
}
