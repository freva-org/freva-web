import React, { useState } from "react";

import { Modal, Image } from "react-bootstrap";

import PropTypes from "prop-types";

import { FaRegFile } from "react-icons/fa";

function FileItem({ content }) {
  const [showImageModal, setShowImageModal] = useState(false);

  function renderImage() {
    return (
      <>
        <Image
          className="bot-shadow"
          role="button"
          onClick={() => setShowImageModal(true)}
          src={content.preview_url}
          thumbnail
        />
        <Modal
          size="xl"
          aria-labelledby="contained-modal-title-vcenter"
          centered
          show={showImageModal}
          onHide={() => {
            setShowImageModal(false);
          }}
        >
          <Modal.Header closeButton></Modal.Header>
          <Modal.Body className="d-flex justify-content-center">
            <img className="w-100" src={content.preview_url} />
          </Modal.Body>
        </Modal>
      </>
    );
  }

  function renderFiles() {
    return (
      <>
        <li className="d-inline-block">
          <div className="border bot-shadow br-8 me-2 bg-light d-flex align-items-center p-2">
            <FaRegFile color="grey" className="me-2" />
            <a
              className="text-decoration-none bot-text"
              href={content.preview_url}
              download
            >
              {content.path}
            </a>
          </div>
        </li>
      </>
    );
  }

  function renderItem() {
    if (content.mime_type.includes("image")) {
      return renderImage();
    } else {
      return renderFiles();
    }
  }

  return renderItem();
}

FileItem.propTypes = {
  content: PropTypes.object,
};

export default FileItem;
