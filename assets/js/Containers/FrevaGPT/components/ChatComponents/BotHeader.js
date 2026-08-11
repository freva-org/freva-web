import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import { Button, Form, Row, Col, Container } from "react-bootstrap";

import PropTypes from "prop-types";

import { FaRegCommentAlt, FaHistory } from "react-icons/fa";

import { setBotModel, toggleShowCode } from "../../actions";

import { fetchWithAuth, successfulPing } from "../../utils";
import useBotSelect from "../../customHooks/useBotSelect";

function BotHeader({ createNewChat, showThreadHistory, setShowThreadHistory }) {
  const botModel = useSelector((state) => state.frevaGPTReducer.botModel);
  const showCode = useSelector((state) => state.frevaGPTReducer.showCode);
  const dispatch = useDispatch();

  useEffect(() => {
    async function fetchBotModels() {
      const getBotModels = async () => {
        const response = await fetchWithAuth(`/api/chatbot/availablechatbots/`);
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
  const [localBot, setLocalBot] = useState(false);

  useBotSelect(hideBotModelList, setHideBotModelList, hideBotModelList);

  function toggleShowThreadHistory() {
    setShowThreadHistory(!showThreadHistory);
  }

  function toggleLocalModel() {
    const newValue = !localBot;
    setLocalBot(newValue);
    if (newValue) {
      dispatch(setBotModel("local"));
    } else {
      dispatch(setBotModel(""));
    }
  }

  return (
    <Container className="mb-2">
      <Row>
        <Col md={2}>
          <h2>ClimateClaw</h2>
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

        <Col md={8}>
          {botOkay ? (
            <Row>
              <Col className="align-content-center">
                <Form.Switch
                  type="switch"
                  id="model-switch"
                  label="Self-hosted model"
                  onClick={toggleLocalModel}
                />
              </Col>
              <Col className="align-content-center">
                <Form.Switch
                  type="switch"
                  id="code-switch"
                  label="Hide code"
                  onClick={() => dispatch(toggleShowCode(showCode))}
                />
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
