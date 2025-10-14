import React from "react";

import { Placeholder } from "react-bootstrap";

export default function TextPlaceholder() {
  return (
    <Placeholder as="a" animation="glow" key={"threadsPlaceholder"}>
      <Placeholder xs={12} className="rounded-1" />
      <Placeholder xs={8} className="rounded-1" />
      <Placeholder xs={10} className="rounded-1" />
      <Placeholder xs={5} className="rounded-1" />
    </Placeholder>
  );
}
