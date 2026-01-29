import * as constants from "./constants";

const frevaGPTInitialState = {
  conversation: [],
  thread: "",
  botModel: "",
  showCode: true,
  showMessageToast: false,
  messageToastContent: { color: "", message: "" },
};

export const frevaGPTReducer = (state = frevaGPTInitialState, action) => {
  switch (action.type) {
    case constants.SET_CONVERSATION:
      return { ...state, conversation: action.payload };
    case constants.SET_THREAD:
      return { ...state, thread: action.payload };
    case constants.SET_BOT_MODEL:
      return { ...state, botModel: action.payload };
    case constants.TOGGLE_SHOW_CODE:
      return { ...state, showCode: action.payload };
    case constants.ADD_ELEMENT:
      return {
        ...state,
        conversation: [...state.conversation, action.payload],
      };
    case constants.SET_SHOW_MESSAGE_TOAST:
      return { ...state, showMessageToast: action.payload };
    case constants.SET_MESSAGE_TOAST_CONTENT:
      return { ...state, messageToastContent: action.payload };
    default:
      return state;
  }
};
