import React from 'react';
import PropTypes from "prop-types";
import { connect } from 'react-redux';

import { Col, Card } from 'react-bootstrap';

import { isEmpty } from 'lodash';

import Markdown from 'react-markdown';

import CodeBlock from "./CodeBlock";

import { replaceLinebreaks } from './utils';

class ChatBlock extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {

        const { conversation } = this.props.chatBlock;

        return(
            <Col>
               {conversation.map((element) => {
                if (element.variant !== "ServerHint" && element.variant !== "StreamEnd") {
                  switch(element.variant){
                    case "Image":
                      return (
                        <Col key={element.content} md={{span: 10, offset: 0}}>
                          <img className="w-100" src={`data:image/jpeg;base64,${element.content}`} />
                        </Col>
                      );
  
                    case "Code":
                    case "CodeOutput":
                      if (isEmpty(element.content[0])) return null;
                      else return(
                        <Col md={{span:10, offset: 0}} key={element.content}>
                          <CodeBlock title={element.variant} code={element.content}/>
                        </Col>
                      );
  
                    case "User":
                      return (
                        <Col md={{span: 10, offset: 2}} key={element.content}>
                          <Card className="shadow-sm card-body border-0 border-bottom mb-3 bg-info">
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
                        <Col md={{span: 10, offset: 0}} key={element.content}>
                          <Card className="shadow-sm card-body border-0 border-bottom mb-3 bg-danger">
                            <span className="fw-bold">{element.variant}</span>
                            <Markdown>{replaceLinebreaks(element.content)}</Markdown>
                          </Card>
                        </Col>
                      );
                    default:
                      return (
                        <Col md={{span: 10, offset: 0}} key={element.content}>
                          <Card className="shadow-sm card-body border-0 border-bottom mb-3 bg-light">
                            <Markdown>{replaceLinebreaks(element.content)}</Markdown>
                          </Card>
                        </Col>
                      );  
                  }
                }
              }
              )}
            </Col>
        )
    }
}

ChatBlock.propTypes = {
    chatBlock: PropTypes.shape({
        thread: PropTypes.string,
        conversation: PropTypes.array,
    }),
}

const mapStateToProps = (state) => ({
    chatBlock: state.frevaGPTReducer,
  })

export default connect(mapStateToProps)(ChatBlock);