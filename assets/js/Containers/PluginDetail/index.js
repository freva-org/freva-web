import React from 'react';
import ReactDOM from 'react-dom';
import {connect} from 'react-redux';
import {loadPlugin, resetPlugin, sendDeveloperMail} from './actions';
import {Container, Row, Col, Button, ButtonToolbar, Modal, FormControl} from 'react-bootstrap';
import nl2br from 'react-nl2br';
import Linkify from 'linkify-react';

import Spinner from '../../Components/Spinner';

class PluginDetail extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            showModal: false,
        };
    }

    componentDidMount() {
        this.props.dispatch(loadPlugin(this.props.params.pluginName))
    }

    componentWillUnmount() {
        this.props.dispatch(resetPlugin());
    }

    handleSend() {
        const text = ReactDOM.findDOMNode(this.refs.textarea).value;
        this.props.dispatch(sendDeveloperMail(text, this.props.plugin.name));
        this.setState({showModal: false});
        ReactDOM.findDOMNode(this.refs.textarea).value = '';
    }

    render() {

        const {plugin} = this.props;

        // Wait until plugin loaded
        if (!plugin.name) {
            return (
                <Spinner />
            )
        }

        return (
            <Container>
                <Row>
                    <Col md={12}>
                        <h2>{plugin.name}</h2>
                    </Col>
                    <Col md={12}>
                        <p>
                            <Linkify properties={{target: '_blank'}}>
                                {nl2br(plugin.long_description)}
                            </Linkify>
                        </p>
                    </Col>
                    <Col md={12}>
                        <ButtonToolbar>
                            <Button variant="primary" href={`/plugins/${plugin.name.toLowerCase()}/setup/`}>Start
                                analysis</Button>
                            <Button variant="primary" href={`/history/?plugin=${plugin.name.toLowerCase()}`}>Show
                                history</Button>
                            {plugin.docpage ?
                                <Button variant="primary" href={plugin.docpage}>Documentation</Button> : null}
                            {plugin.tool_developer ?
                                <Button variant="info" onClick={() => this.setState({showModal: true})}>Contact
                                    Developer</Button> : null}
                        </ButtonToolbar>
                    </Col>
                </Row>

                {plugin.tool_developer ?
                    <Modal show={this.state.showModal}
                           onHide={() => this.setState({showModal: false})}>
                        <Modal.Header closeButton>
                            <Modal.Title>Contact developer</Modal.Title>
                        </Modal.Header>

                        <Modal.Body>
                            <p>
                                The developer of {plugin.name} is <strong>{plugin.tool_developer.name}</strong>.
                                If you have questions or want to report a bug, please send him a message:
                            </p>
                            <FormControl componentClass="textarea" ref="textarea"/>
                        </Modal.Body>

                        <Modal.Footer>
                            <Button variant="primary" onClick={() => this.handleSend()}>Send</Button>
                        </Modal.Footer>

                    </Modal> : null}
            </Container>
        )
    }
}

const mapStateToProps = state => ({
    plugin: state.pluginDetailReducer.plugin
});

export default connect(mapStateToProps)(PluginDetail);
