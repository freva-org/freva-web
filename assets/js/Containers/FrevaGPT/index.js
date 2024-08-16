import React, { useState, useEffect } from 'react';
import { Container, Row } from 'react-bootstrap';

const ChatBot = () => {
  const [pingResponse, setPingResponse] = useState(null);

  useEffect(() => {
    const fetchPing = async () => {
      try {
        const response = await fetch('/api/chatbot/ping/');
        const data = await response.text();
        setPingResponse(data);
      } catch (error) {
        setPingResponse({ error: 'Failed to fetch ping' });
    }
    };

    fetchPing();
  }, []);

  return (
    <Container>
      <Row>
        {pingResponse ? (
          <div>{JSON.stringify(pingResponse)}</div>
        ) : (
          <div>Loading...</div>
        )}
      </Row>
    </Container>
  );
};

export default ChatBot;
