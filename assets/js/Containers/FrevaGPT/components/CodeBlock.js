import React from "react";
import { Card, Collapse } from "react-bootstrap";
import { FaAngleDown, FaAngleUp } from "react-icons/fa";

import PropTypes from "prop-types";

import Highlight from "react-highlight";

import { formatCode } from "../utils";

class CodeBlock extends React.Component {

  constructor(props) {
    super(props);
    this.toggleShowCode = this.toggleShowCode.bind(this);

    this.state = {
      showCode: false,
    }
  }

  toggleShowCode(status) {
    this.setState({showCode: !status});
  }

  render() {
    return (
      <Card className="shadow-sm card-body border-0 border-bottom mb-3 bg-light">
        <p className="m-0">
          Analyzed 
          <span>
            {this.state.showCode ? <FaAngleUp onClick={() => {this.toggleShowCode(this.state.showCode)}}/> : <FaAngleDown onClick={() => {this.toggleShowCode(this.state.showCode)}}/>}
          </span>
        </p>
        <Collapse in={this.state.showCode} className="mt-2">
        <Card className="shadow-sm">
          <Card.Header>python</Card.Header>
          <Card.Body className="p-0 m-0">
            <Highlight className="python">
              {formatCode(this.props.title, this.props.code[0])}
            </Highlight>
          </Card.Body>
        </Card>
        </Collapse>
      </Card>
    );
  }
}

CodeBlock.propTypes = {
  code: PropTypes.array,
  title: PropTypes.string,
};

export default CodeBlock;
