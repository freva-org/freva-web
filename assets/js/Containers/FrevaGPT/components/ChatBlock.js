import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";

import { Col, Card, Modal, Button, Alert } from "react-bootstrap";

import { isEmpty } from "lodash";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { FaExpand } from "react-icons/fa";

import { replaceLinebreaks } from "../utils";

import * as constants from "../constants";

import CodeBlock from "./CodeBlock";

function ChatBlock() {
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

    for (const element of conversation) {
      if (element.variant !== "Code" && element.variant !== "CodeOutput") {
        if (
          element.variant !== "ServerHint" &&
          element.variant !== "StreamEnd"
        ) {
          newConv.push([element]);
        }
      } else {
        const existingIndex = newConv.findIndex(
          (x) => x[0].content.length > 1 && x[0].id === element.id
        );
        if (existingIndex === -1) {
          newConv.push([element]);
        } else {
          newConv[existingIndex].push(element);
        }
      }
    }

    return newConv;
  }

  const rearrangedConversation = useMemo(() => {
    return rearrangeCodeElements(conversation);
  }, [conversation]);

  function renderImage(element, index) {
    return (
      <div className="w-75 mb-5" key={index}>
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
            <FaExpand className="color" />
          </Button>
        </div>
      </div>
    );
  }

  function renderCode(element, index) {
    if (isEmpty(element[0].content)) {
      return null;
    } else {
      return (
        <Col md={constants.BOT_COLUMN_STYLE} key={`${index}-code`}>
          <CodeBlock showCode={showCode} content={element} />
        </Col>
      );
    }
  }

  function renderUser(element, index) {
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

  function renderError(element, index) {
    return (
      <Col md={12} key={`${index}-error`}>
        <Alert variant="danger" className="shadow-sm mb-3">
          <span className="fw-bold">{element.variant}</span>
          <ReactMarkdown>{replaceLinebreaks(element.content)}</ReactMarkdown>
        </Alert>
      </Col>
    );
  }

  function renderDefault(element, index) {
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

  function renderChatComponents(element, index) {
    switch (element[0].variant) {
      case "ServerHint":
      case "StreamEnd":
        return null;
      case "Image":
        return renderImage(element[0], index);

      case "Code":
      case "CodeOutput":
        return renderCode(element, index);

      case "User":
        return renderUser(element[0], index);

      case "ServerError":
      case "OpenAIError":
      case "CodeError":
      case "FrontendError":
      case "InvalidThread":
      case "UserStop":
        return renderError(element[0], index);

      default:
        return renderDefault(element[0], index);
    }
  }

  function render() {
    return (
      <>
        <Col>
          {rearrangedConversation.map((element, index) => {
            return renderChatComponents(element, index);
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

export default React.memo(ChatBlock);
