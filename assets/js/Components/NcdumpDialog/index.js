import React from "react";
import ReactHtmlParser from "react-html-parser";
import { Modal, Button, FormControl, Alert } from "react-bootstrap";

import Spinner from "../Spinner";

class NcdumpDialog extends React.Component {

  constructor (props) {
    super(props);
    this.state = { pw: "" };

    this.handleChange = this.handleChange.bind(this);
  }

  submitNcdump () {
    const { pw } = this.state;
    this.props.submitNcdump(this.props.file, pw);
  }

  handleChange (e) {
    this.setState({ pw: e.target.value });
  }

  render () {
    const { show, onClose, status, output, file } = this.props;
    return (
      <Modal
        show={show} size="lg" dialogClassName="ncdump-modal"
        onShow={() => {if (this.state.pw !== "") {this.submitNcdump();}}}
        onHide={() => onClose()}
      >
        <Modal.Header closeButton>
          <Modal.Title className="fs-5">{status === "ready" ? `Metadata for ${file}` : "Enter your password"}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <span style={status === "pw" || status === "pw_fail" ? {} : { display: "none" }}>
            {status === "pw_fail" ? <Alert variant="danger"><strong>Wrong password!</strong> Please try again.</Alert> : null}
            <p>To start Ncdump you have to re-enter your password</p>
            <form method="post" id="passForm" name="passForm">
              <FormControl id="username" type="text" name="password" style={{ display: "none" }} />
              <FormControl
                id="search" type="password" name="password"
                onChange={this.handleChange} value={this.state.pw}
              />
            </form>
          </span>
          {status === "loading" ? <Spinner /> : null}

          {
            output ?
              <div>
                {output.error_msg ? <div>{output.error_msg}</div> : <pre>{ReactHtmlParser(output.ncdump)}</pre>}
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
