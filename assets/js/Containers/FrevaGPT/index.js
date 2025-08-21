import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import { Container, Row, Col, Spinner } from "react-bootstrap";

import { browserHistory } from "react-router";
import { isEmpty } from "lodash";

import queryString from "query-string";

import BotHeader from "./components/BotHeader";
import ChatBlock from "./components/ChatBlock";
import SidePanel from "./components/SidePanel";
import Suggestions from "./components/Suggestions";
import BotInput from "./components/BotInput";
import BotLoadingSpinner from "./components/BotLoadingSpinner";
import ScrollButtons from "./components/ScrollButtons";
import BotUnavailableAlert from "./components/BotUnavailableAlert";
import PendingAnswerComponent from "./components/PendingAnswerComponent";

import { fetchWithAuth, successfulPing, chatExceedsWindow } from "./utils";

import { setThread, setConversation, addElement } from "./actions";

function FrevaGPT() {
  useEffect(() => {
    async function initializeBot() {
      // if thread giving on mounting the component, set thread within store
      const givenQueryParams = browserHistory.getCurrentLocation().query;
      if (
        Object.hasOwn(givenQueryParams, "thread_id") &&
        !isEmpty(givenQueryParams.thread_id)
      ) {
        dispatch(setThread(givenQueryParams.thread_id));

        // request content of old thread if threa_id is given
        setLoading(true);
        await getOldThread(givenQueryParams.thread_id);
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

  const lastVariant = useRef("User");

  const thread = useSelector((state) => state.frevaGPTReducer.thread);
  const botModel = useSelector((state) => state.frevaGPTReducer.botModel);

  const dispatch = useDispatch();

  /*-----------------------------------------------------------------------------------------------
  *
  -----------------------------------------------------------------------------------------------*/
  function createNewChat() {
    handleStop(false)
      .then(() => {
        dispatch(setConversation([]));
        dispatch(setThread(""));
        browserHistory.push({
          pathname: "/chatbot/",
          search: "",
        });
        setShowSuggestions(true);
        setDynamicAnswer("");
        setDynamicVariant("");
        setReader(undefined);
        setShowScrollButtons(false);
        window.scrollTo(0, 0);
        return;
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error(err);
      });
  }

  async function getOldThread(thread) {
    const queryObject = { thread_id: thread };
    const response = await fetchWithAuth(
      `/api/chatbot/getthread?` + queryString.stringify(queryObject)
    );

    if (response.status >= 200 && response.status <= 299) {
      const variantArray = await response.json();
      dispatch(setConversation(variantArray));
    } else {
      dispatch(setThread(""));
      dispatch(
        setConversation([
          {
            variant: "InvalidThread",
            content:
              "The thread id is invalid or the thread doesn't exist anymore.",
          },
        ])
      );
    }
  }

  /*-----------------------------------------------------------------------------------------------
  *                                       User interaction methods
  -----------------------------------------------------------------------------------------------*/
  async function handleSubmit(input) {
    dispatch(addElement({ variant: "User", content: input }));
    setShowSuggestions(false);
    setLoading(true);

    try {
      await fetchData(input);
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

  async function handleStop(dispatchStopMessage = true) {
    // stop of thread only possible if a thread id is given
    if (reader) {
      await reader.cancel();
    }
    const queryObject = { thread_id: thread };
    if (thread) {
      await fetchWithAuth(
        `/api/chatbot/stop?` + queryString.stringify(queryObject)
      );
    }

    setLoading(false);
    setReader(undefined);
    if (dispatchStopMessage) {
      dispatch(
        addElement({ variant: "UserStop", content: "Request stopped manually" })
      );
    }
  }

  async function fetchData(input) {
    const queryObject = {
      input,
      thread_id: thread,
      chatbot: botModel,
    };

    // response of a new bot request is streamed
    const response = await fetchWithAuth(
      `/api/chatbot/streamresponse?` + queryString.stringify(queryObject)
    ); //, signal);

    if (response.ok) {
      const localReader = response.body.getReader();
      setReader(localReader);
      const decoder = new TextDecoder("utf-8");

      let buffer = "";
      let varObj = {};

      // eslint-disable-next-line no-constant-condition
      while (true) {
        // eslint-disable-next-line no-await-in-loop
        const { done, value } = await localReader.read();
        if (done) {
          break;
        }

        const decodedValues = decoder.decode(value);
        buffer = buffer + decodedValues;

        let foundSomething = true;

        while (foundSomething) {
          foundSomething = false;

          for (
            let bufferIndex = 0;
            bufferIndex < buffer.length;
            bufferIndex++
          ) {
            if (buffer[bufferIndex] !== "}") {
              continue;
            }
            const subBuffer = buffer.slice(0, bufferIndex + 1);

            try {
              const jsonBuffer = JSON.parse(subBuffer);
              buffer = buffer.slice(bufferIndex + 1); // shorten string by already evaluated string

              // object is not empty so compare variants
              if (Object.keys(varObj).length !== 0) {
                // if object has not same variant, add answer to conversation and override object
                if (varObj.variant !== jsonBuffer.variant) {
                  dispatch(addElement(varObj));
                  lastVariant.current = varObj.variant;
                  if (chatExceedsWindow()) {
                    setShowScrollButtons(true);
                  }
                  setDynamicAnswer("");
                  setDynamicVariant("");
                  varObj = jsonBuffer;
                } else {
                  // if object has same variant, add content
                  // eslint-disable-next-line no-lonely-if
                  if (
                    varObj.variant === "Code" ||
                    varObj.variant === "CodeOutput"
                  ) {
                    varObj.content[0] =
                      varObj.content[0] + jsonBuffer.content[0];
                    setDynamicAnswer(varObj.content[0]);
                    setDynamicVariant(varObj.variant);
                  } else {
                    varObj.content = varObj.content + jsonBuffer.content;
                    setDynamicAnswer(varObj.content);
                    setDynamicVariant(varObj.variant);
                  }
                }
              } else {
                // object is empty so add content
                varObj = jsonBuffer;

                // set thread id
                if (thread === "" && varObj.variant === "ServerHint") {
                  try {
                    const currentThreadId = JSON.parse(
                      varObj.content
                    ).thread_id;
                    dispatch(setThread(currentThreadId));
                    browserHistory.push({
                      pathname: "/chatbot/",
                      search: `?thread_id=${currentThreadId}`,
                    });
                  } catch (err) {
                    // handle warning
                  }
                }
              }

              foundSomething = true;
              break;
            } catch (err) {
              // ServerHints and CodeBlocks include nested JSON Objects
              // eslint-disable-next-line no-console
              if (
                !subBuffer.includes("ServerHint") &&
                !subBuffer.includes("Code")
              ) {
                dispatch(
                  addElement({
                    variant: "FrontendError",
                    content: "Incomplete message received.",
                  })
                );
              }
            }
          }
        }
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
        <Col md={3}>
          <SidePanel />
        </Col>

        <Col
          md={9}
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
              <ChatBlock />

              <PendingAnswerComponent
                content={dynamicAnswer}
                variant={dynamicVariant}
                ref={{ lastVariant }}
              />

              <BotLoadingSpinner
                loading={loading}
                dynamicAnswer={dynamicAnswer}
                ref={{ lastVariant }}
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
    return (
      <Container>
        <Row>
          <BotHeader createNewChat={createNewChat} />
          {botOkay === undefined ? (
            <Spinner />
          ) : botOkay ? (
            renderBotContent()
          ) : (
            <BotUnavailableAlert />
          )}
        </Row>
      </Container>
    );
  }

  return render();
}

export default FrevaGPT;
