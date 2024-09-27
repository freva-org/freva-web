import * as constants from './constants';

const botInitialState = {
    conversation: [],
    loading: false,
    thread: ""
};

export const botReducer = (state = botInitialState, action) => {
    switch(action.type) {
        case constants.ADD_ELEMENT:
            return [
                ...state.conversation,
                action
            ];
        case constants.SET_CONVERSATION:
            return ??;
        case constants.SET_THREAD:
            return state.thread = action;
        default:
            return state;
    }
}