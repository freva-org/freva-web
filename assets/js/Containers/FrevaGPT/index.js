import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, FormControl, InputGroup, Card } from 'react-bootstrap';
import JSONStream from 'JSONStream';
import { browserHistory } from "react-router";

import Spinner from "../../Components/Spinner";

import CodeBlock from "./CodeBlock";
import SidePanel from "./SidePanel"; 

const ChatBot = () => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [code, setCode] = useState("");
  const [image, setImage] = useState("");
  const [conversation, setConversation] = useState([]);
  const [answerLoading, setAnswerLoading] = useState(false);
  const thread = useRef("");


  useEffect(() => {
    if (answer !== "") setConversation(prevConversation => [...prevConversation, {type: 'answer', content: answer}])
  }, [answer]);

  useEffect(() => {
    if (code !== "") setConversation(prevConversation => [...prevConversation, {type: 'code', content: code}])
  }, [code])

  useEffect(() => {
    if (image !== "") setConversation(prevConversation => [...prevConversation, {type: 'image', content: image}])
  }, [image])

  const fetchData = async () => {
    const response = await fetch('/api/chatbot/streamresponse?' + new URLSearchParams({
      input: encodeURIComponent(question),
      auth_key: process.env.BOT_AUTH_KEY,
      thread_id: thread.current,
    }).toString());

    const reader = response.body.getReader();
    const jsonStream = JSONStream.parse();

    let botAnswer = "";
    let botCode = "";

    jsonStream.on("data", (value) => {
      console.log(value);
      if (value.variant === 'Image') {
        setImage(value.content);
      } else if (value.variant === "Code") {
        // TODO handle CodeOutput
        botCode = botCode + value.content[0];
      } else if (value.variant !== 'ServerHint' && value.variant !== 'StreamEnd'){
        botAnswer = botAnswer + value.content;
      } else if (value.variant === 'ServerHint') {
        // TODO test for key: warning or of thread_id is even included in an object
        if (thread.current === "") {
          thread.current = JSON.parse(value.content).thread_id;
          browserHistory.push({
            pathname: '/chatbot/',
            search: `?thread_id=${thread.current}&get_thread=false`,
          });
        }
      }
    });

    const pump = async () => {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        // eslint-disable-next-line no-await-in-loop
        const { done, value } = await reader.read();
        if (done) break;
        jsonStream.write(value);
      }
      setCode(botCode);
      setAnswer(botAnswer);
      jsonStream.end();
    };

    await pump();
  };

  async function requestBot() {
    setAnswerLoading(true);
    try {
      await fetchData();
    } catch(error) {
      console.log(error);
      setAnswer('Failed to fetch streamresponse');
    }
    setAnswerLoading(false);
  }

  function handleBotRequest(){
    const newQuestion = {type: 'question', content: question};
    setConversation(prevConversation => [...prevConversation, newQuestion]);
    setQuestion("");

    requestBot();
  }

  function handleInputChange(event) {
    setQuestion(event.target.value);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      handleBotRequest();
    }
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
              if (element.type === 'code') {
                return (<Col md={{span:10, offset: 0}} key={index}><CodeBlock code={element.content}/></Col>);
              } else if (element.type === 'image') {
                return <img key={index} src={`data:image/jpeg;base64,${element.content}`} />
              } else {      
                return (
                  <Col md={element.type === 'answer' ? {span: 10, offset: 0} : {span: 10, offset: 2}} key={index}>
                    <Card 
                      className={element.type === 'answer' ? "shadow-sm card-body border-0 border-bottom mb-3 bg-light"
                                                            : "shadow-sm card-body border-0 border-bottom mb-3 bg-info"}
                      key={index}>
                        {element.content}
                    </Card>
                  </Col>
                );         
              }
            }
            )}
          </Col>

          {answerLoading ? (<Row className="mb-3"><Col md={1}><Spinner/></Col></Row>) : null}

          <Row>
            <Col md={10}>
              <InputGroup className="mb-2 pb-2">
                <FormControl type="text" value={question} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="Ask a question"/>
              </InputGroup>
            </Col>

            <Col md={2}>
              <button onClick={handleBotRequest} disabled={answerLoading} className="btn btn-secondary w-100">Send</button>
            </Col>
          </Row>
          
        </Col>
      </Row>
    </Container>
  );
};

export default ChatBot;
