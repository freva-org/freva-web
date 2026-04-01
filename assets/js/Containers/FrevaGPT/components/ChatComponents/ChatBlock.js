import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";

import { Col, Modal, Button, Alert } from "react-bootstrap";

import { isEmpty } from "lodash";

import ReactMarkdown from "react-markdown";

import { FaExpand } from "react-icons/fa";

import { replaceLinebreaks } from "../../utils";

import * as constants from "../../constants";

import CodeBlock from "./CodeBlock";
import UserInputBlock from "./UserInputBlock";
import AssistantBlock from "./AssistantBlock";

function ChatBlock({ onEditInput }) {
  const [showModal, setShowModal] = useState(false);
  const [image, setImage] = useState("");

  const conversation = useSelector(
    (state) => state.frevaGPTReducer.conversation
  );
  const showCode = useSelector((state) => state.frevaGPTReducer.showCode);

  function enlargeImage(imageString) {
    setShowModal(true);
    setImage(`data:image/jpeg;base64,${imageString}`);
  }

  function rearrangeCodeElements(conversation) {
    const newConv = [];

    let general = 0;
    let user = 0;
    let feedback = 0;

    for (const element of conversation) {
      if (element.variant === "CodeOutput") {
        // rearranging code output to be added to code
        // [{"variant": "Code", ...}, {"variant": "CodeOutput", ...}]
        const indexOfRelatedCode = newConv.findIndex(
          (x) => x[0].content.length > 1 && x[0].id === element.id
        );
        if (indexOfRelatedCode !== -1) {
          element.index = general;
          general++;
          newConv[indexOfRelatedCode].push(element);
        }
      } else {
        // every element gets an internal index
        element.index = general;
        general++;

        // adding additional indexes for specific purpose
        switch (element.variant) {
          case "User": {
            // backend needs specific index for user inputs for editing
            element.user_index = user;
            user++;
            break;
          }
          case "Code":
          case "Assistant": {
            // backend needs specific feddback index for components with feedback buttons
            element.feedback_index = feedback;
            feedback++;
            break;
          }
        }
        newConv.push([element]);
      }
    }
    return newConv;
  }

  const rearrangedConversation = useMemo(() => {
    if (!Array.isArray(conversation)) {
      return [];
    } else {
      return rearrangeCodeElements(conversation);
    }
  }, [conversation]);

  function renderImage(element) {
    return (
      <div className="w-75 mb-5" key={element.id}>
        <img
          onClick={() => enlargeImage(element.content)}
          src={`data:image/jpeg;base64,${element.content}`}
          className="mw-100"
        />
        <div className="d-flex justify-content-end">
          <Button
            variant="link"
            onClick={() => enlargeImage(element.content)}
            className="d-flex align-items-center"
          >
            <FaExpand color="grey" />
          </Button>
        </div>
      </div>
    );
  }

  function renderCode(element) {
    if (isEmpty(element[0].content)) {
      return null;
    } else {
      return (
        <Col md={constants.BOT_COLUMN_STYLE} key={`${element[0].id}-code`}>
          <CodeBlock showCode={showCode} content={element} />
        </Col>
      );
    }
  }

  function renderUser(element) {
    return (
      <UserInputBlock
        content={element}
        key={`UserInputBlock-parent-${element.index}`}
        onEdit={onEditInput}
      />
    );
  }

  function renderError(element) {
    return (
      <Col md={12} key={`${element.index}-error`}>
        <Alert variant="danger" className="shadow-sm mb-3">
          <span className="fw-bold">{element.variant}</span>
          <ReactMarkdown>{replaceLinebreaks(element.content)}</ReactMarkdown>
        </Alert>
      </Col>
    );
  }

  function renderChatComponents(element) {
    switch (element[0].variant) {
      case "ServerHint":
      case "StreamEnd":
      case "ToolCall":
      case "ToolOutput":
        return null;
      case "Image":
        return renderImage(element[0]);

      case "Code":
      case "CodeOutput":
        return renderCode(element);

      case "User":
        return renderUser(element[0]);

      case "ServerError":
      case "OpenAIError":
      case "CodeError":
      case "FrontendError":
      case "InvalidThread":
      case "UserStop":
        return renderError(element[0]);

      default:
        return (
          <AssistantBlock
            key={`${element[0].index}-default`}
            streaming={false}
            content={element[0]}
          />
        );
    }
  }

  function render() {
    return (
      <>
        <Col>
          {rearrangedConversation.map((element) => {
            return renderChatComponents(element);
          })}
        </Col>

        <Modal
          size="xl"
          aria-labelledby="contained-modal-title-vcenter"
          centered
          show={showModal}
          onHide={() => {
            setShowModal(false);
            setImage("");
          }}
        >
          <Modal.Header closeButton></Modal.Header>
          <Modal.Body style={{ display: "flex", justifyContent: "center" }}>
            <img className="w-100" src={image} />
          </Modal.Body>
        </Modal>
      </>
    );
  }

  return render();
}

ChatBlock.propTypes = {
  onEditInput: PropTypes.func,
};

export default React.memo(ChatBlock);
