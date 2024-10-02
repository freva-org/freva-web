import React from 'react';
import PropTypes from "prop-types";
import { connect } from 'react-redux';

import { 
  Container,
  Row,
  Col,
  FormControl,
  InputGroup,
  Card,
  Button } from 'react-bootstrap';

import { browserHistory } from 'react-router';
import { isEmpty, has } from 'lodash';

import Markdown from 'react-markdown';

import Spinner from "../../Components/Spinner";

import CodeBlock from "./CodeBlock";
import SidePanel from "./SidePanel";

import { replaceLinebreaks } from './utils';

import {
  setThread,
  setConversation,
  addElement,
} from './actions';

class FrevaGPT extends React.Component {

  // const abortController = useRef();
  // abortController.current = new AbortController();
  // const signal = abortController.signal;

  constructor(props) {
    super(props);
    this.handleUserInput = this.handleUserInput.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.createNewChat = this.createNewChat.bind(this);

    this.state = {
      loading: false,
      userInput: {},
    };
  }

  componentDidMount() {

    // if thread giving on mounting the component, set thread within store
    const givenQueryParams = browserHistory.getCurrentLocation().query;
    if (has(givenQueryParams, "thread_id") && !isEmpty(givenQueryParams.thread_id)) {
      this.props.dispatch(setThread(givenQueryParams.thread_id));

      // request content of old thread if threa_id is given
      this.setState({ loading: true });
      this.getOldThread(givenQueryParams.thread_id);
      this.setState({ loading: false });
    }
  }

  createNewChat() {

    this.props.dispatch(setConversation([]));
    this.props.dispatch(setThread(""));
    browserHistory.push({
      pathname: '/chatbot/',
      search: "",
    });
    window.scrollTo(0, 0)
  }

  handleUserInput(e) {
    this.setState({ userInput: {variant: "User", content: e.target.value }});
  }

  async handleKeyDown(e) {
    if (e.key === "Enter") {
      this.props.dispatch(addElement(this.state.userInput));
      this.setState({ userInput: {} });

      this.setState({ loading: true });
      try {
        await this.fetchData()
      } catch(err) {
        this.props.dispatch(addElement({ variant: "FrontendError", content: "An error occured during rendering!" }))
      }
      this.setState({ loading: false });
    }
  }

  async fetchData() {
    // response of a new bot request is streamed
    const response = await fetch(`/api/chatbot/streamresponse?` + new URLSearchParams({
      input: this.state.userInput.content,
      auth_key: process.env.BOT_AUTH_KEY,
      thread_id: this.props.frevaGPT.thread,
      freva_config: encodeURIComponent("/work/ch1187/clint/freva-dev/freva/evaluation_system.conf"),
    }).toString()); // add signal for abortController

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
                this.props.dispatch(addElement(varObj));
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
              if (this.props.frevaGPT.thread === "" && varObj.variant === "ServerHint") {
                try {
                  this.props.dispatch(setThread(JSON.parse(varObj.content).thread_id));
                  browserHistory.push({
                    pathname: '/chatbot/',
                    search: `?thread_id=${this.props.frevaGPT.thread}`,
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

  }

  async getOldThread(thread) {
    const response = await fetch(`/api/chatbot/getthread?` + new URLSearchParams({
      auth_key: process.env.BOT_AUTH_KEY,
      thread_id: thread,
      }).toString());
    
    const variantArray = await response.json();
    this.props.dispatch(setConversation(variantArray));
  }

  async handleStop() {
    // stop of thread only possible if a thread id is given
    if (this.state.thread) {
      await fetch(`/api/chatbot/stop?` + new URLSearchParams({
        auth_key: process.env.BOT_AUTH_KEY,
        thread_id: this.props.frevaGPT.thread,
      }).toString());
    }

    // abort fetch request anyway (especially if no thread is given)
    // if (abortController.current) abortController.current.abort();
      
    this.setState({loading: false });
    this.props.dispatch(addElement({variant: "UserStop", content: "Request stopped manually"}))
  }

  render() {

    const {
      conversation,
    } = this.props.frevaGPT;

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
                            <Markdown>{replaceLinebreaks(element.content)}</Markdown>
                          </Card>
                        </Col>
                      );
                    default:
                      return (
                        <Col md={{span: 10, offset: 0}} key={index}>
                          <Card className="shadow-sm card-body border-0 border-bottom mb-3 bg-light" key={index}>
                            <Markdown>{replaceLinebreaks(element.content)}</Markdown>
                          </Card>
                        </Col>
                      );  
                  }
                }
              }
              )}
            </Col>
  
            {this.state.loading ? (<Row className="mb-3"><Col md={1}><Spinner/></Col></Row>) : null}
  
            <Row>
              <Col md={10}>
                <InputGroup className="mb-2 pb-2">
                  <FormControl type="text" onChange={this.handleUserInput} onKeyDown={this.handleKeyDown} placeholder="Ask a question"/>
                  {this.state.loading 
                    ? (<Button variant="outline-danger" id="button-addon2" onClick={this.handleStop}>&#9632;</Button>)
                    : null
                  }
                  
                </InputGroup>
              </Col>
  
              <Col md={2}>
                <button className="btn btn-info w-100" onClick={this.createNewChat}>New Chat</button>
              </Col>
            </Row>
            
          </Col>
        </Row>
      </Container>
    );
  }
}

FrevaGPT.propTypes = {
  frevaGPT: PropTypes.shape({
    thread: PropTypes.string,
    conversation: PropTypes.array,
  }),
  dispatch: PropTypes.func.isRequired,
}

const mapStateToProps = (state) => ({
  frevaGPT: state.frevaGPTReducer,
})

export default connect(mapStateToProps)(FrevaGPT);
