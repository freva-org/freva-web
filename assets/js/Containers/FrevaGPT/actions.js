import * as constants from "./constants";

export function setThread(thread_id) {
  return {
    type: constants.SET_THREAD,
    payload: thread_id,
  };
}

export function setConversation(conversation) {
  return {
    type: constants.SET_CONVERSATION,
    payload: conversation,
  };
}

export function setBotModel(botModel) {
  return {
    type: constants.SET_BOT_MODEL,
    payload: botModel,
  };
}

export function toggleShowCode(showCode) {
  return {
    type: constants.TOGGLE_SHOW_CODE,
    payload: !showCode,
  };
}

export const addElement = (element) => (dispatch) => {
  dispatch({
    type: constants.ADD_ELEMENT,
    payload: element,
  });
};
