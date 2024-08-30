import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import JSONStream from 'JSONStream';

import Spinner from "../../Components/Spinner";

import CodeBlock from "./CodeBlock";

const ChatBot = () => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [code, setCode] = useState("");
  const [image, setImage] = useState("");
  const [conversation, setConversation] = useState([]);
  const [answerLoading, setAnswerLoading] = useState(false);

  const ChatBotStyle = {
    botContainer: {
      display: "flex",
      flexDirection: "column",
    },
    questionInput: {
      width: "90%",
      borderRadius: "10px",
      border: ".1em solid lightgrey",
      padding: "10px",
      boxShadow: "0 .125rem .25rem rgba(0,0,0,.075)",
    },
    questionButton: {
      width: "8%",
      padding: "10px",
      borderRadius: "10px",
      marginLeft: "20px",
      boxShadow: "0 .125rem .25rem rgba(0,0,0,.075)",
    },
    question: {
      backgroundColor: "#aaa",
      borderRadius: "10px",
      padding: "10px",
      boxShadow: "0 .125rem .25rem rgba(0,0,0,.075)",
      listStyle: "none",
      margin: "10px 0px 10px 100px",
    },
    answer: {
      backgroundColor: "#ccc",
      borderRadius: "10px",
      padding: "10px",
      boxShadow: "0 .125rem .25rem rgba(0,0,0,.075)",
      listStyle: "none",
      margin: "10px 100px 10px 0px",
    },
  }

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
    }).toString());

    const reader = response.body.getReader();
    const jsonStream = JSONStream.parse();

    let botAnswer = "";
    let botCode = "";

    jsonStream.on("data", (value) => {

      if (value.variant === 'Image') {
        setImage(value.content);
      } else if (value.variant === "Code" || value.variant === 'CodeOutput') {
        botCode = botCode + value.content[0];
      } else if (value.variant !== 'ServerHint' && value.variant !== 'StreamEnd'){
        botAnswer = botAnswer + value.content;
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
      setAnswer('Failed to fetch streamresponse');
      console.log(error);
    }
    setAnswerLoading(false);
  }

  function handleInputChange(event) {
    setQuestion(event.target.value);
  }

  function handleBotRequest(){
    const newQuestion = {type: 'question', content: question};
    setConversation(prevConversation => [...prevConversation, newQuestion]);
    setQuestion("");

    requestBot();
  }

  return (
    <Container>
      <div style={ChatBotStyle.botContainer}>
        <ul>
          {conversation.map((element, index) => {
            if (element.type === 'code') {
              return <CodeBlock key={index} code={element.content}/>
            } else if (element.type === 'image') {
              return <img key={index} src={`data:image/jpeg;base64,${element.content}`} />
            } else {
              return <li style={ChatBotStyle[element.type]} key={index}>{element.content}</li>}
            }
          )}
        </ul>
        {answerLoading ? (<Spinner/>) : null}

        <div>
          <input style={ChatBotStyle.questionInput} value={question} onChange={handleInputChange} placeholder="Ask a question"/>
          <button style={ChatBotStyle.questionButton} onClick={handleBotRequest} disabled={answerLoading}>Send</button>
        </div>
      </div>
    </Container>
  );
};

export default ChatBot;
