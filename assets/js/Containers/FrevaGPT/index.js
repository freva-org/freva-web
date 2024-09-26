import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, FormControl, InputGroup, Card, Button } from 'react-bootstrap';
import { browserHistory } from "react-router";
import { isEmpty } from 'lodash';
import Markdown from 'react-markdown';

import Spinner from "../../Components/Spinner";

import CodeBlock from "./CodeBlock";
import SidePanel from "./SidePanel";

import helper from './actions';

const ChatBot = () => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState({});
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);

  const thread = useRef("");
  const abortController = useRef();

  useEffect(() => {
    if (!isEmpty(answer)) setConversation(prevConversation => [...prevConversation, answer]);
  }, [answer]);

  useEffect(() => {
    // when starting a new conversation there is no thread_id set on mount
    // when jumping to an old conversion a thread_id is given (needed for loading old conversation)
    const givenQueryParams = browserHistory.getCurrentLocation().query;

    if ("thread_id" in givenQueryParams && givenQueryParams.thread_id !== "") {
      thread.current = givenQueryParams.thread_id;
      getOldThread();
    }
  }, [])

  const getOldThread = async () => {

    const queryObject = {
      auth_key: process.env.BOT_AUTH_KEY,
      thread_id: thread.current,
    }

    // response of a new bot request is streamed
    const response = await fetch(`/api/chatbot/getthread?` + helper.objectToQueryString(queryObject));
    const variantArray = await response.json();
    setConversation(variantArray);
  }

  const fetchData = async () => {

    abortController.current = new AbortController();
    const signal = abortController.signal;

    const queryObject = {
      input: question,
      auth_key: process.env.BOT_AUTH_KEY,
      thread_id: thread.current,
      freva_config: "/work/ch1187/clint/freva-dev/freva/evaluation_system.conf",
    };

    // response of a new bot request is streamed
    const response = await fetch(`/api/chatbot/streamresponse?` + helper.objectToQueryString(queryObject), signal);

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    
    let buffer = "";
    let varObj = {};

    // eslint-disable-next-line no-constant-condition
    while (true) {
      // eslint-disable-next-line no-await-in-loop
      const { done, value } = await reader.read();
      if (done) break;

      const decodedValues = decoder.decode(value);
      buffer = buffer + decodedValues;

      let foundSomething = true;

      while (foundSomething) {
        foundSomething = false;

        for (let bufferIndex = 0; bufferIndex < buffer.length; bufferIndex ++) {

          if (buffer[bufferIndex] !== "}") continue;
          const subBuffer = buffer.slice(0, bufferIndex + 1);

          try {
            const jsonBuffer = JSON.parse(subBuffer);
            buffer = buffer.slice(bufferIndex + 1); // shorten string by already evaluated string        

            // object is not empty so compare variants
            if (Object.keys(varObj).length !== 0) {
              // if object has not same variant, add answer to conversation and override object
              if (varObj.variant !== jsonBuffer.variant) {
                setAnswer(varObj);
                varObj = jsonBuffer;
              } else {
                // if object has same variant, add content
                // eslint-disable-next-line no-lonely-if
                if (varObj.variant === "Code" || varObj.variant === "CodeOutput") varObj.content[0] = varObj.content[0] + jsonBuffer.content[0];
                else varObj.content = varObj.content + jsonBuffer.content;
              }
            } else {
              // object is empty so add content
              varObj = jsonBuffer;

              // set thread id
              if (thread.current === "" && varObj.variant === "ServerHint") {
                try {
                  thread.current = JSON.parse(varObj.content).thread_id;
                  browserHistory.push({
                    pathname: '/chatbot/',
                    search: `?thread_id=${thread.current}`,
                  });
                } catch(err) {
                  // handle warning
                }
              }
            }
            
            foundSomething = true;
            break;
          } catch(err) {
            // don't do anything
          }  
        }
      }
    }
  };

  async function requestBot() {
    setLoading(true);
    try {
      await fetchData();
    } catch(error) {
      console.log(error);
      setConversation(prevConversation => [...prevConversation, { variant: "FrontendError", content: "An error occured during rendering!"}])
    }
    setLoading(false);
  }

  function handleBotRequest(){
    if (question !== "") {
      const newQuestion = {variant: 'User', content: question};
      setConversation(prevConversation => [...prevConversation, newQuestion]);
      setQuestion("");

      requestBot();
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      handleBotRequest();
    }
  }

  function handleInputChange(event) {
    setQuestion(event.target.value);
  }

  async function handleStop() {

    // stop of thread only possible if a thread id is given
    if (thread.current) {
      await fetch(`/api/chatbot/stop?` + new URLSearchParams({
        auth_key: process.env.BOT_AUTH_KEY,
        thread_id: thread.current,
      }).toString());
    }

    // abort fetch request anyway (especially if no thread is given)
    if (abortController.current) abortController.current.abort();
      
    setLoading(false);
    setConversation(prevConversation => [...prevConversation, {variant: "UserStop", content: "Request stopped manually"}]);
  }

  function startNewChat() {
    setConversation([]);
    thread.current = "";
    browserHistory.push({
      pathname: '/chatbot/',
      search: "",
    });
    window.scrollTo(0, 0)
  }
  
  return (
    <Container>
      <Row>
        <div className="d-flex justify-content-between">
          <h2>FrevaGPT</h2>
        </div>

        <Col md={4}>
          <SidePanel/>
        </Col>

        <Col md={8}>
          <Col>
            {conversation.map((element, index) => {
              if (element.variant !== "ServerHint" && element.variant !== "StreamEnd") {
                switch(element.variant){
                  case "Image":
                    return (
                      <Col key={index} md={{span: 10, offset: 0}}>
                        <img className="w-100" src={`data:image/jpeg;base64,${element.content}`} />
                      </Col>
                    );

                  case "Code":
                  case "CodeOutput":
                    if (isEmpty(element.content[0])) return null;
                    else return(
                      <Col md={{span:10, offset: 0}} key={index}>
                        <CodeBlock title={element.variant} code={element.content}/>
                      </Col>
                    );

                  case "User":
                    return (
                      <Col md={{span: 10, offset: 2}} key={index}>
                        <Card className="shadow-sm card-body border-0 border-bottom mb-3 bg-info" key={index}>
                            {element.content}
                        </Card>
                      </Col>
                    );
                  case "ServerError":
                  case "OpenAIError":
                  case "CodeError":
                  case "FrontendError":
                  case "UserStop":
                    return(
                      <Col md={{span: 10, offset: 0}} key={index}>
                        <Card className="shadow-sm card-body border-0 border-bottom mb-3 bg-danger" key={index}>
                          <span className="fw-bold">{element.variant}</span>
                          <Markdown>{helper.replaceLinebreaks(element.content)}</Markdown>
                        </Card>
                      </Col>
                    );
                  default:
                    return (
                      <Col md={{span: 10, offset: 0}} key={index}>
                        <Card className="shadow-sm card-body border-0 border-bottom mb-3 bg-light" key={index}>
                          <Markdown>{helper.replaceLinebreaks(element.content)}</Markdown>
                        </Card>
                      </Col>
                    );  
                }
              }
            }
            )}
          </Col>

          {loading ? (<Row className="mb-3"><Col md={1}><Spinner/></Col></Row>) : null}

          <Row>
            <Col md={10}>
              <InputGroup className="mb-2 pb-2">
                <FormControl type="text" value={question} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="Ask a question" disabled={loading}/>
                {loading 
                  ? (<Button variant="outline-danger" id="button-addon2" onClick={handleStop}>&#9632;</Button>)
                  : null
                }
                
              </InputGroup>
            </Col>

            <Col md={2}>
              <button className="btn btn-info w-100" onClick={startNewChat}>New Chat</button>
            </Col>
          </Row>
          
        </Col>
      </Row>
    </Container>
  );
};

export default ChatBot;
