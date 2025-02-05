import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { Col, Card, Modal } from "react-bootstrap";

import { isEmpty } from "lodash";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { replaceLinebreaks } from "../utils";

import * as constants from "../constants";

import CodeBlock from "./CodeBlock";

class ChatBlock extends React.Component {
  constructor(props) {
    super(props);

    this.renderImage = this.renderImage.bind(this);
    this.renderCode = this.renderCode.bind(this);
    this.renderUser = this.renderUser.bind(this);
    this.renderError = this.renderError.bind(this);
    this.renderDefault = this.renderDefault.bind(this);

    this.state = {
      showModal: false
    }
  }

  renderImage(element, index) {
    return (
      <Col key={`${index}-image`} md={constants.BOT_COLUMN_STYLE}>
        <img
          className="w-100"
          onClick={() => this.setState({showModal: true, image: `data:image/jpeg;base64,${element.content}`})}
          src={`data:image/jpeg;base64,${element.content}`}
        />
      </Col>
    );
  }

  renderCode(element, index) {
    if (isEmpty(element.content[0])) {
      return null;
    } else {
      return (
        <Col md={constants.BOT_COLUMN_STYLE} key={`${index}-code`}>
          <CodeBlock title={element.variant} code={element.content} />
        </Col>
      );
    }
  }

  renderUser(element, index) {
    return (
      <Col md={{ span: 10, offset: 2 }} key={`${index}-user`}>
        <Card
          className="shadow-sm card-body border-0 border-bottom mb-3"
          style={{ backgroundColor: "#eee" }}
        >
          {element.content}
        </Card>
      </Col>
    );
  }

  renderError(element, index) {
    return (
      <Col md={constants.BOT_COLUMN_STYLE} key={`${index}-error`}>
        <Card className="shadow-sm card-body border-0 border-bottom mb-3 bg-danger">
          <span className="fw-bold">{element.variant}</span>
          <ReactMarkdown>{replaceLinebreaks(element.content)}</ReactMarkdown>
        </Card>
      </Col>
    );
  }

  renderDefault(element, index) {
    return (
      <Col md={constants.BOT_COLUMN_STYLE} key={`${index}-default`}>
        <Card className="shadow-sm card-body border-0 border-bottom mb-3 bg-light">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {replaceLinebreaks(element.content)}
          </ReactMarkdown>
        </Card>
      </Col>
    );
  }

  renderChatComponents(element, index) {
    switch (element.variant) {
      case "ServerHint":
      case "StreamEnd":
        return null;
      case "Image":
        return this.renderImage(element, index);

      case "Code":
      case "CodeOutput":
        return this.renderCode(element, index);

      case "User":
        return this.renderUser(element, index);

      case "ServerError":
      case "OpenAIError":
      case "CodeError":
      case "FrontendError":
      case "UserStop":
        return this.renderError(element, index);

      default:
        return this.renderDefault(element, index);
    }
  }

  render() {
    const { conversation } = this.props.chatBlock;

    return (
      <>
        <Col>
          {conversation.map((element, index) => {
            return this.renderChatComponents(element, index);
          })}
        </Col>

        <Modal 
            size="lg" 
            aria-labelledby="contained-modal-title-vcenter"
            centered
            show={this.state.showModal}
            onHide={() => this.setState({ showModal: false, image: '' })}>
          <Modal.Header closeButton></Modal.Header>
          <Modal.Body>
            <img className="w-100" src={this.state.image}/>
          </Modal.Body>
        </Modal>
      </>
      
    );
  }
}

ChatBlock.propTypes = {
  chatBlock: PropTypes.shape({
    thread: PropTypes.string,
    conversation: PropTypes.array,
  }),
};

const mapStateToProps = (state) => ({
  chatBlock: state.frevaGPTReducer,
});

export default connect(mapStateToProps)(ChatBlock);
