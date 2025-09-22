import queryString from "query-string";

import * as constants from "./constants";

export function replaceLinebreaks(data) {
  /**
   * Replaces oddly encoded linebreaks in given string to normal encoded linebreaks
   *
   * @param {string} data - String containing code with linebreaks which are encoded as "\\n"
   * @returns {string} String containing data where "\\n" is exchanged by "\n"
   */
  const formattedData = data.split("\\n").join("\n");
  return formattedData;
}

export function formatCode(mode, data) {
  /**
   * Given string of code is parsed as json and splitted by linebreak into seperate code parts
   *
   * @param {string} mode - String determining if given Data is "Code" or "CodeOutput"
   * @param {string} data - String containing unformatted code
   * @returns {array} Array of code snippets
   */
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
  /**
   * Truncates given value to 32 signs
   *
   * @param {string} value - String to truncate
   * @returns {string} Truncated string
   */
  const trunc = value.substring(0, 32) + "\u2026";
  return trunc;
}

export function resizeInputField() {
  /**
   * Resizes textarea
   */
  const inputField = document.getElementById("inputField");
  const style = inputField.style;

  style.height = inputField.style.minHeight = "auto";
  style.minHeight = `${Math.min(inputField.scrollHeight, parseInt(inputField.style.maxHeight))}px`;
  style.height = `${inputField.scrollHeight}px`;
}

function isLastPage(totalNumber, currentPageNumber) {
  /**
   * Checks if given page is last page by calculating the number of pages
   * based on page size (constants.THREAD_NUMBER) and total number of threads
   *
   * @param {number} totalNumber - Total number of threads
   * @param {number} currentPageNumber - Current page number to compare to total number of pages
   * @return {boolean} Boolean indicating if current page is last page
   */
  const totalPageNumber = totalNumber % constants.THREAD_NUMBER;
  return currentPageNumber === totalPageNumber - 1;
}

/*-------------------------------------------------------------------------------------------------
 *                                  Authentication related functions
-------------------------------------------------------------------------------------------------*/
export async function getAuthToken() {
  /**
   * Retrieves authentication token
   *
   * @returns {string} If token available, a string containing the authentication token is returned
   */
  try {
    const response = await fetch("/get-current-token/");
    const data = await response.json();
    return data.success ? `Bearer ${data.token_data.access_token}` : null;
  } catch (e) {
    return null;
  }
}

export async function fetchWithAuth(url, options = {}) {
  /**
   * Constructs fetch call using the given url and options and adds header including an authentication token
   *
   * @param {string} url - Endpoint to fetch data from
   * @param {object} options - Object of options given to the fetch request (e.g. query parameter)
   * @returns {function} Fetch call including the given parameters as well as authentication headers
   */
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
  /**
   * Pings bot backend to determine if bot is available
   *
   * @returns {boolean} Boolean determining if bot is available (successful ping) or not
   */
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
  /**
   * Requests differen thread endpoints based on given parameters and returns response
   *
   * @param {number} page - Number of page which content should be requested
   * @param {string} query - String containing the serach query
   * @returns {object} Object containing the requested threads in an array and boolean stating
   * if there are more threads available
   */
  const returnValues = { threads: [], hasMore: false };
  const queryParameter = {
    num_threads: constants.THREAD_NUMBER,
    page,
  };

  const endpoint = query ? "searchthreads" : "getuserthreads";
  if (query) {
    queryParameter.query = query;
  }
  const response = await fetchWithAuth(
    `/api/chatbot/${endpoint}?` + queryString.stringify(queryParameter)
  );

  if (response.ok) {
    const values = await response.json();
    returnValues.threads = values[0];
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
  /**
   * Requests thread endpoint providing page and query while also handling setting states
   * according to the request response
   *
   * @param {number} page - Number of the page which content should be requested
   * @param {string} query - String contasining search query
   * @param {function} setLoading - Setter function to set loading state (boolean)
   * @param {function} setThreads - Setter function to set threads content (array of objects)
   * @param {function} setHasMore - Setter function to set state of hasMore (determines if there
   * are more results) (boolean)
   */
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
  /**
   * Checks wether the chat content (scrollHeight of the chat container) exceeds the visible part
   * of the chat window
   *
   * @returns {boolean} Boolean determining if chat content is larger than visible part of the
   * chat container
   */
  const wholeWindowHeight = document.documentElement.clientHeight * 0.8;
  const inputHeight = document.getElementById("botInput").clientHeight;
  const chatHeight = document.getElementById("chatContainer").scrollHeight;

  const chatExceedsWindowHeight = wholeWindowHeight - inputHeight < chatHeight;

  return chatExceedsWindowHeight;
}

export function scrollToChatBottom() {
  /**
   * Scrolling to the bottom of the chat container
   */
  document.getElementById("chatContainer").scrollTo({
    top: document.getElementById("chatContainer").scrollHeight,
    behavior: "smooth",
  });
}

export function scrollToChatTop() {
  /**
   * Scrolling to the top of the chat container
   */
  document
    .getElementById("chatContainer")
    .scrollTo({ top: 0, behavior: "smooth" });
}
