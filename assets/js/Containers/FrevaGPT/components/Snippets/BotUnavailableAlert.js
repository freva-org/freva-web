import React from "react";

import { Alert } from "react-bootstrap";

function BotUnavailableAlert() {
  return (
    <Alert key="botError" variant="danger">
      The bot is currently not available. Please retry later.
    </Alert>
  );
}

export default BotUnavailableAlert;
