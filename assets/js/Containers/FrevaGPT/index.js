import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import { Container, Row, Col, Spinner } from "react-bootstrap";

import { isEmpty } from "lodash";

import BotHeader from "./components/ChatComponents/BotHeader";
import ChatBlock from "./components/ChatComponents/ChatBlock";
import Suggestions from "./components/ChatComponents/Suggestions";
import BotInput from "./components/ChatComponents/BotInput";
import PendingAnswerComponent from "./components/ChatComponents/PendingAnswerComponent";

import SidePanel from "./components/SidePanel/SidePanel";

import BotLoadingSpinner from "./components/Snippets/BotLoadingSpinner";
import ScrollButtons from "./components/Snippets/ScrollButtons";
import BotUnavailableAlert from "./components/Snippets/BotUnavailableAlert";
import MessageToast from "./components/Snippets/MessageToast";

import {
  fetchWithAuth,
  successfulPing,
  chatExceedsWindow,
  grepThreadID,
  updateUrl,
} from "./utils";

import {
  setConversation,
  addElement,
  setMessageToastContent,
  setShowMessageToast,
  setLastVariant,
} from "./actions";

function FrevaGPT() {
  useEffect(() => {
    async function initializeBot() {
      // request content of old thread if thread_id is given
      if (grepThreadID()) {
        setLoading(true);
        await getOldThread(grepThreadID());
        setLoading(false);
        setShowSuggestions(false);
      }

      if (await successfulPing()) {
        setBotOkay(true);
      } else {
        setBotOkay(false);
      }
    }

    initializeBot();
  }, []);

  const [dynamicAnswer, setDynamicAnswer] = useState("");
  const [dynamicVariant, setDynamicVariant] = useState("");
  const [reader, setReader] = useState(undefined);

  const [loading, setLoading] = useState(false);
  const [botOkay, setBotOkay] = useState(undefined);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showScrollButtons, setShowScrollButtons] = useState(false);

  const [showThreadHistory, setShowThreadHistory] = useState(false);
  const botModel = useSelector((state) => state.frevaGPTReducer.botModel);

  const dispatch = useDispatch();

  /*-----------------------------------------------------------------------------------------------
  *
  -----------------------------------------------------------------------------------------------*/
  function createNewChat() {
    /**
     * Creates new chat, stopping running conversations before and clearing state variables
     *
     */
    if (reader !== undefined) {
      handleStop(false);
    }

    dispatch(setConversation([]));
    updateUrl("");
    setShowSuggestions(true);
    setDynamicAnswer("");
    setDynamicVariant("");
    setReader(undefined);
    setShowScrollButtons(false);
    window.scrollTo(0, 0);
    return;
  }

  function alertInvalidThreadID() {
    /**
     * Adds error message to chat stating that an invalid thread id was given
     */
    dispatch(
      setConversation([
        {
          variant: "InvalidThreadID",
          content:
            "The thread id is invalid or the thread doesn't exist anymore.",
        },
      ])
    );
  }

  async function getOldThread(threadID) {
    /**
     * Requests old conversation based on given threadID
     *
     * @param {string} threadID - ThreadID of conversation which should be loaded
     */
    const response = await fetchWithAuth(`/api/chatbot/getthread`, {
      method: "POST",
      body: JSON.stringify({
        thread_id: threadID,
      }),
    });

    if (response.ok) {
      const variantArray = await response.json();
      if (!Array.isArray(variantArray) && "variant" in variantArray) {
        alertInvalidThreadID();
      } else {
        //eslint-disable-next-line no-console
        console.log("### Old thread: ", variantArray);
        dispatch(setConversation(variantArray));
      }
    } else {
      alertInvalidThreadID();
    }
  }

  /*-----------------------------------------------------------------------------------------------
  *                                       User interaction methods
  -----------------------------------------------------------------------------------------------*/
  async function handleSubmit(input) {
    /**
     * Sends request to bot including the given user input
     *
     * @param {string} input - Given user input
     */
    dispatch(addElement({ variant: "User", content: input }));
    setShowSuggestions(false);
    setLoading(true);

    // backend always requires a thread id to be send with streamresponse
    // for new conversation without existing thread id -> request new thread id and set it
    if (isEmpty(grepThreadID())) {
      const response = await fetchWithAuth("/api/chatbot/newthread");

      if (response.ok) {
        const init_thread_id = await response.json();
        updateUrl(`?thread_id=${init_thread_id}`);
      } else {
        //eslint-disable-next-line no-console
        console.error("Could not fetch new thread id!", response.statusText);
      }
    }

    try {
      await streamResponse(input);
    } catch (err) {
      dispatch(
        addElement({
          variant: "FrontendError",
          content: "An error occured during rendering!",
        })
      );
      // eslint-disable-next-line no-console
      console.error(err);
    }
    setLoading(false);
  }

  async function handleEditChat(newInput, chatObject) {
    /**
     * Handles edit of converstaion by stopping running conversation streams,
     * setting new thread id and starting request to bot with edited input
     *
     * @param {string} newInput - Edited input from user
     * @param {object} chatObject - Objection containing new threadID and conversation history until edited input {new_thread_id: "", history: [...]}
     */
    handleStop(false)
      .then(() => {
        dispatch(setConversation(chatObject.history));
        updateUrl(`?thread_id=${chatObject.new_thread_id}`);
        handleSubmit(newInput, chatObject.new_thread_id);
        return;
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error(err);
      });
  }

  async function handleStop(dispatchStopMessage = true) {
    /**
     * Stops running bot request and running stream responses
     *
     * @param {boolean} dispatchStopMessage - Determines if stop message should be shown
     */
    if (grepThreadID() && loading) {
      const response = await fetchWithAuth(`/api/chatbot/stop`, {
        method: "POST",
        body: JSON.stringify({
          thread_id: grepThreadID(),
        }),
      });

      if (!response.ok) {
        const message = await response.json();
        dispatch(
          setMessageToastContent({
            color: "danger",
            message: message.detail,
          })
        );
        dispatch(setShowMessageToast(true));
      }
    }

    // stop of thread only possible if a thread id is given
    if (reader) {
      await reader.cancel();
    }

    setLoading(false);
    setDynamicAnswer("");
    setDynamicVariant("");
    setReader(undefined);
    if (dispatchStopMessage) {
      dispatch(
        addElement({ variant: "UserStop", content: "Request stopped manually" })
      );
    }
  }

  /*-----------------------------------------------------------------------------------------------
  *                                           Data fetching
  -----------------------------------------------------------------------------------------------*/
  function addToExistingVariant(varObj) {
    /**
     * Adds content to already existing variant
     *
     * @param {object} varObj -  Object containing current varaint and content
     */
    setDynamicAnswer(varObj.content);
    setDynamicVariant(varObj.variant);
  }

  function addNewVariant(varObj) {
    /**
     *  Adds old variant to conversation and starts new variant with given content
     *
     * @param {object} varObj - Object containing current varaint and content
     */
    dispatch(addElement(varObj));
    dispatch(setLastVariant(varObj.variant));
    if (chatExceedsWindow()) {
      setShowScrollButtons(true);
    }
    setDynamicAnswer("");
    setDynamicVariant("");
  }

  function handleServerHint(varObj) {
    /**
     * Handle ServerHint variant setting thread id if necessary
     *
     * @param {object} varObj - Object containing current varaint and content
     */
    // set thread id if no id given or newly provided id differs from current one
    if (
      varObj.variant === "ServerHint" &&
      Object.keys(varObj.content).includes("thread_id")
    ) {
      if (
        grepThreadID() === "" ||
        grepThreadID() !== varObj.content.thread_id
      ) {
        updateUrl(`?thread_id=${varObj.content.thread_id}`);
      }
    }
  }

  function handleData(varObj, parsedData) {
    /**
     * Received data is handles based on a comparison of parsedData and varObj
     *
     * @param {object} varObj - Object containing content of last received response
     * @param {object} parsedData - Object containing content of current received response
     */
    let iVarObj = varObj;

    // object is not empty so compare variants
    if (Object.keys(varObj).length !== 0) {
      // if object has not same variant, add answer to conversation and override object
      if (varObj.variant !== parsedData.variant) {
        addNewVariant(iVarObj);
        iVarObj = parsedData;
      } else {
        // if object has same variant, add content
        iVarObj.content += parsedData.content;
        addToExistingVariant(iVarObj);
      }
    } else {
      // object is empty so add content
      iVarObj = parsedData;
      handleServerHint(iVarObj);
    }

    return iVarObj;
  }

  function extractData(data, varObj, buffer) {
    /**
     * Recursive function extracting data from given input and buffering incomplete objects
     *
     * @param {string} data - String containing received response
     * @param {object} varObj - Object containing values from last received response
     * @param {string} buffer - String containing buffered values
     */
    let iVarObj = varObj;
    let iBuffer = buffer;

    // split data by linebreaks
    const variantArray = data.split("\n").filter((elem) => !isEmpty(elem));

    for (let index = 0; index < variantArray.length; index++) {
      try {
        // try parsing the element of the splitted input
        // and handle the data according to it's content
        const parsedVariant = JSON.parse(variantArray[index]);
        iVarObj = handleData(iVarObj, parsedVariant);

        // if the given data is the same as the data of the buffer
        // we are inside a nested run of the function
        // if the parsing is sucessful, the buffered data was included
        // into the conversation and can be deleted from the buffer
        if (String(data) === String(iBuffer)) {
          iBuffer = "";
        }
      } catch (err) {
        // if the parsing fails and the input and the buffer have the same value
        // we are inside a nested run using the buffer as input data
        // the buffer data is only used as input data if it contains a closing }
        // asuming a json object containing the data
        // if the parsing fails, the received data seems to be missformated
        if (String(data) === String(iBuffer)) {
          dispatch(
            addElement({
              variant: "FrontendError",
              content: err,
            })
          );
          //eslint-disable-next-line no-console
          console.log("Error parsing: ", iBuffer);
        } else {
          // on failed parsing add content to buffer so it can be merged with the next
          // content arriving and tested to be parsed and handled like normal data
          iBuffer += variantArray[index];
          if (iBuffer.endsWith("}")) {
            // if the buffer was merged and the current state ends with a } we assume
            // that the unfinished object was completed and we now attempt to parse the data
            // and handle its addition to the conversation calling this function recursively
            // using the buffer as input data
            const result = extractData(iBuffer, iVarObj, iBuffer);
            iBuffer = result.buffer;
            iVarObj = result.varObj;
          }
        }
      }
    }

    return { varObj: iVarObj, buffer: iBuffer };
  }

  async function streamResponse(input) {
    /**
     * Fetches stream response from bot answering the given input adding it to the already existing conversation
     *
     * @param {string} input - User input
     */
    // response of a new bot request is streamed
    const response = await fetchWithAuth(`/api/chatbot/streamresponse`, {
      method: "POST",
      body: JSON.stringify({
        input,
        thread_id: grepThreadID(),
        chatbot: botModel,
      }),
    });

    if (response.ok) {
      const localReader = response.body.getReader();
      setReader(localReader);
      const decoder = new TextDecoder("utf-8");

      let varObj = {};
      let buffer = "";

      // eslint-disable-next-line no-constant-condition
      while (true) {
        // eslint-disable-next-line no-await-in-loop
        const { done, value } = await localReader.read();
        if (done) {
          break;
        }

        const decodedValues = decoder.decode(value);
        const result = extractData(decodedValues, varObj, buffer);
        varObj = result.varObj;
        buffer = result.buffer;
      }
    } else {
      dispatch(
        addElement({
          variant: "ServerError",
          content: response.statusText,
        })
      );
    }
  }

  /*-----------------------------------------------------------------------------------------------
  *                                         Render functions
  -----------------------------------------------------------------------------------------------*/
  function renderBotContent() {
    /**
     * Renders main bot components (ChatBlock, BotInput, SidePanel etc.)
     */
    const windowHeight = document.documentElement.clientHeight * 0.8;
    const emptyDivHeight = showSuggestions
      ? 0
      : document.documentElement.clientHeight * 0.5;

    // better solution needed (wasn't able to find any suitable bootstrap class -> need of fixed height for overflow-auto -> scrolling)
    const chatWindow = {
      height: windowHeight,
    };

    return (
      <>
        <SidePanel
          showThreadHistory={showThreadHistory}
          setShowThreadHistory={setShowThreadHistory}
        />
        <Col
          md={12}
          className={
            "d-flex flex-column " +
            (showSuggestions
              ? "justify-content-start"
              : "justify-content-between")
          }
          style={chatWindow}
        >
          <Row className="overflow-auto position-relative" id="chatContainer">
            <Col md={12}>
              <ChatBlock onEditInput={handleEditChat} />

              <PendingAnswerComponent
                content={dynamicAnswer}
                variant={dynamicVariant}
              />

              <BotLoadingSpinner
                loading={loading}
                dynamicAnswer={dynamicAnswer}
              />
              {loading ? <div style={{ height: emptyDivHeight }}></div> : null}
            </Col>
            {showScrollButtons ? <ScrollButtons /> : null}
          </Row>

          <Row>
            {showSuggestions ? (
              <Suggestions handleSubmit={handleSubmit} />
            ) : null}
            <BotInput
              loading={loading}
              handleSubmit={handleSubmit}
              handleStop={handleStop}
            />
          </Row>
        </Col>
      </>
    );
  }

  /*---------------------------------------------------------------------------------------------*/
  function render() {
    /**
     * Renders all chat related components
     */
    return (
      <Container>
        <Row>
          <BotHeader
            createNewChat={createNewChat}
            showThreadHistory={showThreadHistory}
            setShowThreadHistory={setShowThreadHistory}
          />
          {botOkay === undefined ? (
            <Spinner />
          ) : botOkay ? (
            renderBotContent()
          ) : (
            <BotUnavailableAlert />
          )}
        </Row>
        <MessageToast />
      </Container>
    );
  }

  return render();
}

export default FrevaGPT;
