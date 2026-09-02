import React, { useState } from "react";

import { Modal, Image, Button, Alert } from "react-bootstrap";

import PropTypes from "prop-types";

import { FaRegFile } from "react-icons/fa";

function FileItem({ content }) {
  const [showImageModal, setShowImageModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);

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
        <li
          className="d-inline-block"
          role="button"
          onClick={() => setShowFileModal(true)}
        >
          <div className="border bot-shadow br-8 me-2 bg-light d-flex align-items-center p-2">
            <FaRegFile color="grey" className="me-2" />
            <span>Filename.txt</span>
          </div>
        </li>
        <Modal
          size="s"
          aria-labelledby="contained-modal-title-vcenter"
          centered
          show={showFileModal}
          onHide={() => {
            setShowFileModal(false);
          }}
        >
          <Modal.Header closeButton>Dowload File</Modal.Header>
          <Modal.Body>
            <p>Do you want to download the file?</p>
            <Alert variant="danger">
              Please be aware that the files could contain faulty or malicious
              content.
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowFileModal(false)}
              className="bot-shadow br-8"
            >
              Cancel
            </Button>
            <Button className="bot-shadow br-8" variant="info">
              Download
            </Button>
          </Modal.Footer>
        </Modal>
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
