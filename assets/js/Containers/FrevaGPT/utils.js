import queryString from "query-string";

import * as constants from "./constants";

export function replaceLinebreaks(data) {
  const formattedData = data.split("\\n").join("\n");
  return formattedData;
}

export function formatCode(mode, data) {
  let shortData = data;

  // replace first linebreak in code got from old thread
  if (data.startsWith("\\n")) {
    shortData = data.replace("\\n", "");
  }

  let codeSnippets;
  let rawCode;

  try {
    if (mode === "Code") {
      rawCode = JSON.parse(shortData).code;
    } else if (mode === "CodeOutput") {
      rawCode = shortData;
    }
    codeSnippets = rawCode.split("\\n");
  } catch (err) {
    // do something
  }

  return codeSnippets;
}

export function truncate(value) {
  const trunc = value.substring(0, 32) + "\u2026";
  return trunc;
}

export function resizeInputField() {
  const inputField = document.getElementById("inputField");
  const style = inputField.style;

  style.height = inputField.style.minHeight = "auto";
  style.minHeight = `${Math.min(inputField.scrollHeight, parseInt(inputField.style.maxHeight))}px`;
  style.height = `${inputField.scrollHeight}px`;
}

function isLastPage(totalNumber, currentPageNumber) {
  const totalPageNumber = totalNumber % constants.THREAD_NUMBER;
  return currentPageNumber === totalPageNumber - 1;
}

/*-------------------------------------------------------------------------------------------------
 *                                  Authentication related functions
-------------------------------------------------------------------------------------------------*/
export async function getAuthToken() {
  try {
    const response = await fetch("/get-current-token/");
    const data = await response.json();
    return data.success ? `Bearer ${data.token_data.access_token}` : null;
  } catch (e) {
    return null;
  }
}

export async function fetchWithAuth(url, options = {}) {
  const token = await getAuthToken();
  const headers = { ...options.headers };
  if (token) {
    headers["X-Freva-User-Token"] = token;
  }
  return fetch(url, { ...options, headers });
}

/*-------------------------------------------------------------------------------------------------
 *                                        Endpoint requests
-------------------------------------------------------------------------------------------------*/
export async function successfulPing() {
  let pingSuccessful = false;

  try {
    const response = await fetchWithAuth("/api/chatbot/ping");
    if (response.status === 200) {
      pingSuccessful = true;
    }
  } catch (err) {
    pingSuccessful = false;
  }

  return pingSuccessful;
}

export async function requestUserThreads(page, query) {
  const returnValues = { threads: [], hasMore: false };
  let response;
  const queryParameter = {
    num_threads: constants.THREAD_NUMBER,
    page,
  };

  if (query) {
    queryParameter.query = query;
    response = await fetchWithAuth(
      `/api/chatbot/searchthreads?` + queryString.stringify(queryParameter)
    );
  } else {
    response = await fetchWithAuth(
      `/api/chatbot/getuserthreads?` + queryString.stringify(queryParameter)
    );
  }

  if (response.ok) {
    const values = await response.json();
    returnValues.threads = values[0]; // waiting for adaptation of searchthreads endpoint
    returnValues.hasMore = !isLastPage(values[1], page);
  }

  return returnValues;
}

export async function handleThreadsRequest(
  page,
  query,
  setLoading,
  setThreads,
  setHasMore
) {
  setLoading(true);
  const response = await requestUserThreads(page, query ? query : undefined);
  setThreads((prevThreads) => [...prevThreads, ...response.threads]);
  setHasMore(response.hasMore);
  setLoading(false);
}

/*-------------------------------------------------------------------------------------------------
 *                                  Scrolling related functions
-------------------------------------------------------------------------------------------------*/
export function chatExceedsWindow() {
  const wholeWindowHeight = document.documentElement.clientHeight * 0.8;
  const inputHeight = document.getElementById("botInput").clientHeight;
  const chatHeight = document.getElementById("chatContainer").scrollHeight;

  const chatExceedsWindowHeight = wholeWindowHeight - inputHeight < chatHeight;

  return chatExceedsWindowHeight;
}

export function scrollToChatBottom() {
  document.getElementById("chatContainer").scrollTo({
    top: document.getElementById("chatContainer").scrollHeight,
    behavior: "smooth",
  });
}

export function scrollToChatTop() {
  document
    .getElementById("chatContainer")
    .scrollTo({ top: 0, behavior: "smooth" });
}
