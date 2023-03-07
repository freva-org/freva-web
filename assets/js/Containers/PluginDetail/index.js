import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import {
  Container,
  Row,
  Col,
  Button,
  ButtonToolbar,
  Modal,
  FormControl,
  Alert,
} from "react-bootstrap";
import nl2br from "react-nl2br";
import Linkify from "linkify-react";

import Spinner from "../../Components/Spinner";

import { loadPlugin, resetPlugin, sendDeveloperMail } from "./actions";

class PluginDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      text: "",
      errorMessage: "",
    };

    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
    this.props.dispatch(loadPlugin(this.props.params.pluginName));
  }

  componentWillUnmount() {
    this.props.dispatch(resetPlugin());
  }

  handleSend() {
    this.props.dispatch(
      sendDeveloperMail(this.state.text, this.props.plugin.name)
    );
    this.setState({ showModal: false, text: "" });
  }

  handleChange(e) {
    this.setState({ text: e.target.value });
  }

  render() {
    const { plugin } = this.props;

    // Wait until plugin loaded
    if (!plugin.name && !this.props.errorMessage) {
      return <Spinner />;
    }

    if (this.props.errorMessage) {
      return (
        <Container>
          <Alert variant="danger">
            <div className="fs-4">{this.props.errorMessage}</div>
          </Alert>
        </Container>
      );
    }

    return (
      <Container>
        <Row>
          <Col md={12}>
            <h2>{plugin.name}</h2>
          </Col>
          <Col md={12}>
            <p>
              <Linkify>{nl2br(plugin.long_description)}</Linkify>
            </p>
            {plugin.user_exported && (
              <div className="text-danger mb-2">
                This plugin has been exported
              </div>
            )}
          </Col>
          <Col md={12}>
            <ButtonToolbar>
              <Button
                variant="success"
                className="me-2"
                href={`/plugins/${plugin.name.toLowerCase()}/setup/`}
              >
                Start analysis
              </Button>
              <Button
                variant="primary"
                className="me-2"
                href={`/history/?plugin=${plugin.name.toLowerCase()}`}
              >
                Show history
              </Button>
              {plugin.docpage ? (
                <Button
                  variant="primary"
                  className="me-2"
                  href={plugin.docpage}
                >
                  Documentation
                </Button>
              ) : null}
              {plugin.tool_developer ? (
                <Button
                  variant="info"
                  className="me-2"
                  onClick={() => this.setState({ showModal: true })}
                >
                  Contact Developer
                </Button>
              ) : null}
            </ButtonToolbar>
          </Col>
        </Row>

        {plugin.tool_developer ? (
          <Modal
            show={this.state.showModal}
            onHide={() => this.setState({ showModal: false })}
          >
            <Modal.Header closeButton>
              <Modal.Title>Contact developer</Modal.Title>
            </Modal.Header>

            <Modal.Body>
              <p>
                The developer of {plugin.name} is{" "}
                <strong>{plugin.tool_developer.name}</strong>. If you have
                questions or want to report a bug, please send him a message:
              </p>
              <FormControl as="textarea" onChange={this.handleChange} />
            </Modal.Body>

            <Modal.Footer>
              <Button variant="primary" onClick={() => this.handleSend()}>
                Send
              </Button>
            </Modal.Footer>
          </Modal>
        ) : null}
      </Container>
    );
  }
}

PluginDetail.propTypes = {
  params: PropTypes.shape({
    pluginName: PropTypes.string.isRequired,
  }),
  errorMessage: PropTypes.string,
  plugin: PropTypes.shape({
    name: PropTypes.string,
    tool_developer: PropTypes.shape({
      name: PropTypes.string,
    }),
    docpage: PropTypes.string,
    user_exported: PropTypes.bool,
    long_description: PropTypes.string,
  }),
  dispatch: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  plugin: state.pluginDetailReducer.plugin,
  errorMessage: state.pluginDetailReducer.errorMessage,
});

export default connect(mapStateToProps)(PluginDetail);
