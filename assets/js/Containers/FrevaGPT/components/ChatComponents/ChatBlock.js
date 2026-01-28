import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";

import { Col, Card, Modal, Button, Alert } from "react-bootstrap";

import { isEmpty } from "lodash";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { FaExpand } from "react-icons/fa";

import { replaceLinebreaks, setGivenFeedbackValue } from "../../utils";

import * as constants from "../../constants";

import FeedbackButtons from "../Snippets/FeedbackButtons";

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
    // integration of index because of rearrangement
    // original index is needed for assigning user feedback and editing user input
    for (const [index, element] of conversation.entries()) {
      if (element.variant !== "Code" && element.variant !== "CodeOutput") {
        // handling all non-code elements
        if (
          element.variant !== "ServerHint" &&
          element.variant !== "StreamEnd"
        ) {
          // TODO: what about frontend errors?
          element.original_index = index;
          newConv.push([element]);
        }
      } else {
        // handling code elements
        const existingIndex = newConv.findIndex(
          (x) => x[0].content.length > 1 && x[0].id === element.id
        );
        element.original_index = index;
        if (existingIndex === -1) {
          // no code element there yet
          newConv.push([element]);
        } else {
          // already existing code element with matching id
          newConv[existingIndex].push(element);
        }
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
            <FaExpand className="color" />
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
        <Col md={constants.BOT_COLUMN_STYLE} key={`${element.id}-code`}>
          <CodeBlock
            showCode={showCode}
            content={element}
            elementIndex={element[0].original_index}
          />
        </Col>
      );
    }
  }

  function renderUser(element) {
    return (
      <Col md={{ span: 10, offset: 2 }} key={`${element.original_index}-user`}>
        <Card
          className="shadow-sm card-body border-0 border-bottom mb-3"
          style={{ backgroundColor: "#eee" }}
        >
          {element.content}
        </Card>
      </Col>
    );
  }

  function renderError(element) {
    return (
      <Col md={12} key={`${element.original_index}-error`}>
        <Alert variant="danger" className="shadow-sm mb-3">
          <span className="fw-bold">{element.variant}</span>
          <ReactMarkdown>{replaceLinebreaks(element.content)}</ReactMarkdown>
        </Alert>
      </Col>
    );
  }

  function renderDefault(element) {
    return (
      <Col
        md={constants.BOT_COLUMN_STYLE}
        key={`${element.original_index}-default`}
      >
        <Card className="shadow-sm card-body border-0 border-bottom mb-3 bg-light">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {replaceLinebreaks(element.content)}
          </ReactMarkdown>
          <FeedbackButtons
            elementIndex={element.original_index}
            givenValue={setGivenFeedbackValue(element)}
          />
        </Card>
      </Col>
    );
  }

  function renderChatComponents(element) {
    switch (element[0].variant) {
      case "ServerHint":
      case "StreamEnd":
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
        return renderDefault(element[0]);
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

export default React.memo(ChatBlock);
