import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import {
  Container,
  Row,
  Col,
  FormControl,
  InputGroup,
  Button,
  Form,
  Alert,
  Tooltip,
  OverlayTrigger,
  Spinner,
  Card,
} from "react-bootstrap";

import { browserHistory } from "react-router";
import { isEmpty, debounce } from "lodash";

import { FaStop, FaPlay, FaArrowDown, FaArrowUp } from "react-icons/fa";

import queryString from "query-string";

import ChatBlock from "./components/ChatBlock";
import SidePanel from "./components/SidePanel";
import PendingAnswerComponent from "./components/PendingAnswerComponent";

import {
  truncate,
  chatExceedsWindow,
  getPosition,
  scrollToChatBottom,
  fetchWithAuth,
  resizeInputField,
} from "./utils";

import { setThread, setConversation, addElement } from "./actions";

import { botSuggestions } from "./exampleRequests";

function FrevaGPT() {
  useEffect(async () => {
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

    const successfulPing = async () => {
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
    };

    const getBotModels = async () => {
      const response = await fetchWithAuth(`/api/chatbot/availablechatbots?`);
      if (response.ok) {
        setBotModelList(await response.json());
      } else {
        setBotModelList(["No model information available."]);
      }
    };

    if (await successfulPing()) {
      setBotOkay(true);
      await getBotModels();
    } else {
      setBotOkay(false);
    }

    setPosition();
  }, []);

  const [userInput, setUserInput] = useState("");
  const [botModelList, setBotModelList] = useState([]);
  const [botModel, setBotModel] = useState("");
  const [dynamicAnswer, setDynamicAnswer] = useState("");
  const [dynamicVariant, setDynamicVariant] = useState("");
  const [reader, setReader] = useState(undefined);

  const [loading, setLoading] = useState(false);
  const [hideBotModelList, setHideBotModelList] = useState(true);
  const [botOkay, setBotOkay] = useState(undefined);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const [atBottom, setAtBottom] = useState(false);
  const [atTop, setAtTop] = useState(true);

  const lastVariant = useRef("User");

  const thread = useSelector((state) => state.frevaGPTReducer.thread);

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
        setAtBottom(true);
        setAtTop(true);
        window.scrollTo(0, 0);
        return;
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error(err);
      });
  }

  function toggleBotSelect() {
    setHideBotModelList(!hideBotModelList);
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
  function handleUserInput(e) {
    setUserInput(e.target.value);
  }

  async function handleKeyDown(e) {
    if (e.key === "Enter" && !isEmpty(e.target.value.trim())) {
      e.preventDefault(); // preventing to add a new line within textare when sending request by pressing enter
      handleSubmit(e.target.value);
    }
  }

  async function submitUserInput() {
    if (!isEmpty(userInput.trim())) {
      await handleSubmit(userInput);
    }
    setUserInput("");
  }

  async function handleSubmit(input) {
    dispatch(addElement({ variant: "User", content: input }));
    setShowSuggestions(false);
    setUserInput("");
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
  *                                     
  -----------------------------------------------------------------------------------------------*/
  function setPosition() {
    const position = getPosition();
    setAtBottom(position.atBottom);
    setAtTop(position.atTop);
  }

  function scrollDown() {
    if (chatExceedsWindow() && atBottom) {
      scrollToChatBottom();
    }
  }

  /*-----------------------------------------------------------------------------------------------
  *                                         Render functions
  -----------------------------------------------------------------------------------------------*/
  /*------------------------------------- Small content snippets --------------------------------*/
  function renderAlert() {
    return (
      <Alert key="botError" variant="danger">
        The bot is currently not available. Please retry later.
      </Alert>
    );
  }

  function renderChatSpinner() {
    return (
      <>
        {loading && !dynamicAnswer ? (
          <Row className="mb-3">
            <Col md={3}>
              <Card className="shadow-sm card-body border-0 border-bottom mb-3 bg-light d-flex flex-row align-items-center">
                <Spinner size="sm" />
                <span className="ms-2">
                  {lastVariant.current === "Code"
                    ? "Executing..."
                    : "Thinking..."}
                </span>
              </Card>
            </Col>
          </Row>
        ) : null}
      </>
    );
  }

  function renderScrollButtons() {
    // here also no suitable solutions using bootstrap found -> need for better solution
    const scrollButtonStyle = {
      zIndex: 10,
      right: "40px",
      bottom: "10px",
      position: "sticky",
    };

    return (
      <>
        <Col
          md={12}
          style={scrollButtonStyle}
          className="d-flex flex-row justify-content-end"
        >
          <div className="d-flex flex-column">
            {!atTop ? (
              <Button
                variant="secondary"
                className={!atBottom ? "mb-2" : ""}
                onClick={() =>
                  document
                    .getElementById("chatContainer")
                    .scrollTo({ top: 0, behavior: "smooth" })
                }
              >
                <FaArrowUp />
              </Button>
            ) : null}

            {!atBottom ? (
              <Button variant="secondary" onClick={() => scrollToChatBottom()}>
                <FaArrowDown />
              </Button>
            ) : null}
          </div>
        </Col>
      </>
    );
  }

  /*---------------------------------------- Bot components -------------------------------------*/
  function renderBotHeader() {
    return (
      <div className="d-flex justify-content-between mb-2">
        <Form.Select
          value={botModel}
          onChange={(e) => {
            setBotModel(e.target.value);
          }}
          className="me-1"
          placeholder="Model"
          hidden={hideBotModelList}
        >
          {botModelList.map((model) => {
            return <option key={model}>{model}</option>;
          })}
        </Form.Select>
        <Button onClick={createNewChat} variant="info">
          NewChat
        </Button>
      </div>
    );
  }

  function renderSuggestions() {
    return (
      <>
        {showSuggestions ? (
          <>
            {botSuggestions.map((element) => {
              return (
                <div key={`${element}-div`} className="col-md-3 mb-2">
                  <OverlayTrigger
                    key={`${element}-tooltip`}
                    overlay={<Tooltip>{element}</Tooltip>}
                  >
                    <Button
                      className="h-100 w-100"
                      variant="outline-secondary"
                      onClick={() => handleSubmit(element)}
                    >
                      {truncate(element)}
                    </Button>
                  </OverlayTrigger>
                </div>
              );
            })}
          </>
        ) : null}
      </>
    );
  }

  function renderBotInput() {
    return (
      <Col id="botInput">
        <InputGroup className="mb-2 pb-2">
          <FormControl
            as="textarea"
            id="inputField"
            rows={1}
            value={userInput}
            onChange={(e) => {
              handleUserInput(e);
              resizeInputField();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question"
          />
          {loading ? (
            <Button
              variant="outline-danger"
              onClick={handleStop}
              className="d-flex align-items-center"
            >
              <FaStop />
            </Button>
          ) : (
            <Button
              variant="outline-success"
              onClick={submitUserInput}
              className="d-flex align-items-center"
            >
              <FaPlay />
            </Button>
          )}
        </InputGroup>
      </Col>
    );
  }

  function renderBotContent() {
    const windowHeight = document.documentElement.clientHeight * 0.8;

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
          <Row
            className="overflow-auto position-relative"
            id="chatContainer"
            onScroll={debounce(setPosition, 100)}
          >
            <Col md={12}>
              <ChatBlock onScrollDown={scrollDown} />

              <PendingAnswerComponent
                content={dynamicAnswer}
                variant={dynamicVariant}
                atBottom={atBottom}
                ref={{ lastVariant }}
              />

              {renderChatSpinner()}
            </Col>
            {renderScrollButtons()}
          </Row>

          <Row>
            {renderSuggestions()}
            {renderBotInput()}
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
          <div className="d-flex justify-content-between">
            <h2 onClick={toggleBotSelect}>FrevaGPT</h2>

            {botOkay ? renderBotHeader() : null}
          </div>

          {botOkay === undefined ? (
            <Spinner />
          ) : botOkay ? (
            renderBotContent()
          ) : (
            renderAlert()
          )}
        </Row>
      </Container>
    );
  }

  return render();
}

export default FrevaGPT;
