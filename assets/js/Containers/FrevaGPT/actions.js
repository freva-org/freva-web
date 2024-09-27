import * as constants from './constants';

export function setThread(thread_id) {

    return {
        type: "SET_THREAD",
        payload: thread_id,
    };
}

export async function getOldThread(thread_id) {
    const response = await fetch(`/api/chatbot/getthread?` + new URLSearchParams({
        auth_key: process.env.BOT_AUTH_KEY,
        thread_id: thread_id,
        }).toString());
      
    const variantArray = await response.json();

    return {
        type: "SET_CONVERSATION",
        payload: variantArray,
    }
}

export function setConversation(conversation) {
    return {
        type: "SET_CONVERSATION",
        payload: conversation,
    };
}

export const addElement = (element) => (dispatch) => {
    dispatch({
        type: constants.ADD_ELEMENT,
        payload: element,
    })
}