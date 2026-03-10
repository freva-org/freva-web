import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import { Button, Form, Row, Col, Container } from "react-bootstrap";

import PropTypes from "prop-types";

import { FaRegCommentAlt, FaHistory, FaCode } from "react-icons/fa";

import { setBotModel, toggleShowCode } from "../../actions";

import { fetchWithAuth, successfulPing } from "../../utils";

function BotHeader({ createNewChat, showThreadHistory, setShowThreadHistory }) {
  const botModel = useSelector((state) => state.frevaGPTReducer.botModel);
  const showCode = useSelector((state) => state.frevaGPTReducer.showCode);
  const dispatch = useDispatch();

  useEffect(() => {
    async function fetchBotModels() {
      const getBotModels = async () => {
        const response = await fetchWithAuth(`/api/chatbot/availablechatbots?`);
        if (response.ok) {
          setBotModelList(await response.json());
        } else {
          setBotModelList(["No model information available."]);
        }
      };

      if (await successfulPing()) {
        setBotOkay(true);
        await getBotModels();
      }
    }

    fetchBotModels();
  }, []);

  const [botOkay, setBotOkay] = useState(undefined);
  const [botModelList, setBotModelList] = useState([]);
  const [hideBotModelList, setHideBotModelList] = useState(true);

  function toggleBotSelect() {
    setHideBotModelList(!hideBotModelList);
  }

  function toggleShowThreadHistory() {
    setShowThreadHistory(!showThreadHistory);
  }

  return (
    <Container className="mb-2">
      <Row>
        <Col md={5}>
          <h2 onClick={toggleBotSelect}>FrevaGPT</h2>
        </Col>

        <Col className="mb-2">
          {botOkay ? (
            <Form.Select
              value={botModel}
              onChange={(e) => {
                dispatch(setBotModel(e.target.value));
              }}
              className="me-1"
              placeholder="Model"
              hidden={hideBotModelList}
            >
              {botModelList.map((model) => {
                return <option key={model}>{model}</option>;
              })}
            </Form.Select>
          ) : null}
        </Col>

        <Col md={5}>
          {botOkay ? (
            <Row>
              <Col>
                <Button
                  variant={showCode ? "outline-secondary" : "secondary"}
                  onClick={() => dispatch(toggleShowCode(showCode))}
                  className="me-1 bot-shadow br-8 w-100"
                >
                  <FaCode className="me-1" />
                  <span className="d-none d-sm-inline">
                    {showCode ? "Hide Code" : "Show Code"}
                  </span>
                </Button>
              </Col>
              <Col>
                <Button
                  variant="secondary"
                  className="me-1 bot-shadow br-8 w-100"
                  onClick={toggleShowThreadHistory}
                >
                  <FaHistory className="me-1" />
                  <span className="d-none d-sm-inline">History</span>
                </Button>
              </Col>
              <Col>
                <Button
                  onClick={() => createNewChat()}
                  variant="secondary"
                  className="bot-shadow br-8 w-100"
                >
                  <FaRegCommentAlt className="me-1" />
                  <span className="d-none d-sm-inline">New Chat</span>
                </Button>
              </Col>
            </Row>
          ) : null}
        </Col>
      </Row>
    </Container>
  );
}

BotHeader.propTypes = {
  createNewChat: PropTypes.func,
  showThreadHistory: PropTypes.bool,
  setShowThreadHistory: PropTypes.func,
};

export default BotHeader;
