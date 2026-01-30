import * as constants from "./constants";

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

export function setShowMessageToast(showMessageToast) {
  return {
    type: constants.SET_SHOW_MESSAGE_TOAST,
    payload: showMessageToast,
  };
}

export function setMessageToastContent(messageToastContent) {
  return {
    type: constants.SET_MESSAGE_TOAST_CONTENT,
    payload: messageToastContent,
  };
}
