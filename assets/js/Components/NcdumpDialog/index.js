import React from "react";
import ReactHtmlParser from "react-html-parser";
import { Modal, Button, FormControl, Alert } from "react-bootstrap";

import Spinner from "../Spinner";

class NcdumpDialog extends React.Component {

  submitNcdump () {
    this.props.submitNcdump(this.props.file);
  }

  render () {
    const { show, onClose, status, output, file } = this.props;
    return (
      <Modal
        show={show} size="lg" dialogClassName="ncdump-modal"
        onHide={() => onClose()}
      >
        <Modal.Header closeButton>
          <Modal.Title className="fs-5">Metadata for {file}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {status === "loading" ? <Spinner /> : null}

          {
            output ?
              <div>
                {output.error_msg ? <div>{output.error_msg}</div> : <pre className="d-flex justify-content-center" dangerouslySetInnerHTML={{ __html: output.ncdump }}></pre>}
              </div> : null
          }

        </Modal.Body>

        <Modal.Footer>
          <Button variant="primary" onClick={() => this.submitNcdump()}>Start Ncdump</Button>
        </Modal.Footer>

      </Modal>
    );
  }
}

export default NcdumpDialog;
