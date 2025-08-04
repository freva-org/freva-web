import React from "react";
import { Card, Collapse, Button } from "react-bootstrap";
import { FaAngleDown, FaAngleUp, FaRegCopy } from "react-icons/fa";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  materialDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";

import PropTypes from "prop-types";

import ClipboardToast from "../../../Components/ClipboardToast";

import { formatCode } from "../utils";

class CodeBlock extends React.Component {
  constructor(props) {
    super(props);
    this.toggleShowCode = this.toggleShowCode.bind(this);
    this.extractElements = this.extractElements.bind(this);
    this.copyCode = this.copyCode.bind(this);
    this.setToastShow = this.setToastShow.bind(this);

    this.state = {
      showCode: true,
      showToast: false,
    };
  }

  toggleShowCode(status) {
    this.setState({ showCode: !status });
  }

  extractElements(content, variant) {
    return content.filter((elem) => elem.variant === variant);
  }

  setToastShow(status) {
    this.setState({ showToast: status });
  }

  copyCode() {
    const code = this.extractElements(this.props.content, "Code").map(
      (codeElement) => {
        return formatCode("Code", codeElement.content[0]);
      }
    );
    navigator.clipboard.writeText(code);
    this.setState({ showToast: true });
  }

  render() {
    return (
      <>
        <Card className="shadow-sm card-body border-0 border-bottom mb-3 bg-light">
          <Button
            variant="link"
            className="m-0 p-0 d-inline-flex text-decoration-none"
            onClick={() => {
              this.toggleShowCode(this.state.showCode);
            }}
          >
            <span style={{ fontWeight: "bold" }} className="color">
              Analyzed
            </span>
            <span>
              {this.state.showCode ? (
                <FaAngleUp className="color" />
              ) : (
                <FaAngleDown className="color" />
              )}
            </span>
          </Button>

          <Collapse in={this.state.showCode} className="mt-2">
            <Card className="shadow-sm">
              <Card.Header style={{ backgroundColor: "#eee" }}>
                <div className="d-flex justify-content-between align-items-center">
                  python
                  <Button variant="link" onClick={this.copyCode}>
                    <span>
                      <FaRegCopy className="color" />
                    </span>
                  </Button>
                </div>
              </Card.Header>

              {this.extractElements(this.props.content, "Code").map(
                (codeElement) => {
                  return (
                    <Card.Body
                      className="p-0 m-0 border-bottom"
                      key={`${codeElement.content[1]}-code`}
                      style={{ backgroundColor: "#fafafa" }}
                    >
                      <SyntaxHighlighter language="python" style={oneLight}>
                        {formatCode("Code", codeElement.content[0])}
                      </SyntaxHighlighter>
                    </Card.Body>
                  );
                }
              )}

              {this.extractElements(this.props.content, "CodeOutput").map(
                (codeElement) => {
                  return (
                    <Card.Footer
                      className="p-0 m-0"
                      key={`${codeElement.content[1]}-codeoutput`}
                      style={{ backgroundColor: "#263238", fontSize: "0.72em" }}
                    >
                      <SyntaxHighlighter language="python" style={materialDark}>
                        {formatCode("CodeOutput", codeElement.content[0])}
                      </SyntaxHighlighter>
                    </Card.Footer>
                  );
                }
              )}
            </Card>
          </Collapse>
        </Card>
        <ClipboardToast
          show={this.state.showToast}
          setShow={this.setToastShow}
        />
      </>
    );
  }
}

CodeBlock.propTypes = {
  content: PropTypes.array,
};

export default CodeBlock;
