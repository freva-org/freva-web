import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import { Button, Form } from "react-bootstrap";

import PropTypes from "prop-types";

import { FaRegCommentAlt, FaHistory } from "react-icons/fa";

import { setBotModel } from "../../actions";

import { fetchWithAuth, successfulPing } from "../../utils";

function BotHeader({ createNewChat, showThreadHistory, setShowThreadHistory }) {
  const botModel = useSelector((state) => state.frevaGPTReducer.botModel);
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
            variant="secondary"
            className="me-1"
            onClick={toggleShowThreadHistory}
          >
            <FaHistory /> History
          </Button>
          <Button onClick={() => createNewChat()} variant="info">
            <FaRegCommentAlt /> New Chat
          </Button>
        </div>
      ) : null}
    </div>
  );
}

BotHeader.propTypes = {
  createNewChat: PropTypes.func,
  showThreadHistory: PropTypes.bool,
  setShowThreadHistory: PropTypes.func,
};

export default BotHeader;
