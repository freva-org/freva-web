import * as constants from "./constants";

export const getCurrentUser = () => (dispatch) => {
  const url = "/api/users/active/";
  return fetch(url, {
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        throw Error(response.statusText);
      }
    })
    .then((json) =>
      dispatch({
        type: constants.GET_CURRENT_USER_SUCCESS,
        payload: json,
      })
    )
    .catch((error) => {
      dispatch({
        type: constants.SET_ERROR,
        payload: error,
      });
    });
};
