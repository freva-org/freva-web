import React from "react";

import { Placeholder } from "react-bootstrap";

export default function TextPlaceholder() {
  return (
    <Placeholder as="a" animation="glow" key={"threadsPlaceholder"}>
      <Placeholder xs={12} style={{ borderRadius: "3px" }} />
      <Placeholder xs={8} style={{ borderRadius: "3px" }} />
      <Placeholder xs={10} style={{ borderRadius: "3px" }} />
      <Placeholder xs={5} style={{ borderRadius: "3px" }} />
    </Placeholder>
  );
}
