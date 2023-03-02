import * as constants from "./constants";

const pluginInitialState = {
  plugin: {},
  errorMessage: "",
};

export const pluginDetailReducer = (state = pluginInitialState, action) => {
  switch (action.type) {
    case constants.LOAD_PLUGIN:
      return { ...state, plugin: action.payload };
    case constants.RESET_PLUGIN:
      return { ...state, plugin: pluginInitialState.plugin };
    case constants.LOAD_PLUGIN_ERROR:
      return { ...state, errorMessage: action.errorMessage };
    default:
      return state;
  }
};
