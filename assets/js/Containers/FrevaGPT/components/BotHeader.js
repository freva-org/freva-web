import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import { Button, Form } from "react-bootstrap";

import PropTypes from "prop-types";

import { setBotModel, toggleShowCode } from "../actions";

import { fetchWithAuth, successfulPing } from "../utils";

function BotHeader({ createNewChat }) {
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

  return (
    <div className="d-flex justify-content-between">
      <h2 onClick={toggleBotSelect}>FrevaGPT</h2>

      {botOkay ? (
        <div className="d-flex justify-content-between mb-2">
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
          <Button
            className="mx-2"
            onClick={() => dispatch(toggleShowCode(showCode))}
            variant={showCode ? "outline-secondary" : "secondary"}
          >
            {showCode ? "Hide code" : "Show code"}
          </Button>
          <Button onClick={() => createNewChat()} variant="info">
            NewChat
          </Button>
        </div>
      ) : null}
    </div>
  );
}

BotHeader.propTypes = {
  createNewChat: PropTypes.func,
};

export default BotHeader;
