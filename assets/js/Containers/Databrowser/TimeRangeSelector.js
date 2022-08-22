import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import {
  BsRecordCircleFill,
  BsRecordCircle,
  BsCircleSquare
} from "react-icons/bs";
import {
  parseISO,
  isValid,
  isBefore,
} from "date-fns";
import {
  Button,
  InputGroup,
  Dropdown,
  DropdownButton,
  Form,
  OverlayTrigger,
  Tooltip
} from "react-bootstrap";

import { setTimeRange } from "./actions";
import { TIME_RANGE_FILE, TIME_RANGE_FLEXIBLE, TIME_RANGE_STRICT } from "./constants";

const dateRegex = /^[-]?\d{4}(-[01]\d(-[0-3]\d(T[0-2]\d(:[0-5]\d)?Z?)?)?)?$/;
const selectorDefaultText = "Select operator";

function TimeRangeSelector ({ databrowser, dispatch }) {
  const [selector, setSelector] = useState(selectorDefaultText);
  const [minDate, setMinDate] = useState("");
  const [maxDate, setMaxDate] = useState("");

  const inputRef = useRef(null);

  useEffect(() => {
    setMinDate(databrowser.minDate);
    setMaxDate(databrowser.maxDate);
    setSelector(databrowser.dateSelector);
  }, [databrowser]);

  function applyChanges () {
    dispatch(setTimeRange({ dateSelector: selector, minDate, maxDate }));
  }

  let minDateErrorMessage = "";
  let maxDateErrorMessage = "";
  let parsedMinDate;
  let parsedMaxDate;
  if (minDate.length >= 4) {
    parsedMinDate = parseISO(minDate);
    if (!isValid(parsedMinDate) || !minDate.match(dateRegex)) {
      minDateErrorMessage = "Invalid date format";
    }
  }
  if (maxDate.length >= 4) {
    parsedMaxDate = parseISO(maxDate);
    if (!isValid(parsedMaxDate)) {
      maxDateErrorMessage = "Invalid date format";
    } else if (isValid(parsedMinDate) &&
        (isBefore(parsedMaxDate, parsedMinDate))) {
      maxDateErrorMessage = "Max date must be after or equals to min date";
    }
  }

  let tooltipText = "";
  if (selector === selectorDefaultText) {
    tooltipText = "Please choose a select operator";
  } else if (maxDate.length < 4 || minDate.length < 4) {
    tooltipText = "Both date must consist of at least a year information with four digits";
  } else if (minDateErrorMessage) {
    tooltipText = minDateErrorMessage;
  } else if (maxDateErrorMessage) {
    tooltipText = maxDateErrorMessage;
  }

  let applyButton;
  if (tooltipText) {
    const tooltip = (
      <Tooltip id="boxWarning"> {tooltipText} </Tooltip>
    );
    applyButton = (
      <OverlayTrigger overlay={tooltip} placement="top">
        <span>
          <Button variant="danger" onClick={applyChanges} disabled>
            Apply
          </Button>
        </span>
      </OverlayTrigger>);
  } else {
    applyButton = (
      <Button variant="primary" onClick={applyChanges}>
        Apply
      </Button>
    );
  }

  return (
    <div>
      <DropdownButton
        className="mb-4 selector-button"
        variant="secondary"
        title={selector}
        id="input-group-dropdown-1"
      >
        <Dropdown.Item onClick={setSelector.bind(this, TIME_RANGE_FLEXIBLE)} href="#">
          <BsCircleSquare />&nbsp;
          {TIME_RANGE_FLEXIBLE}
        </Dropdown.Item>
        <Dropdown.Item onClick={setSelector.bind(this, TIME_RANGE_STRICT)} href="#">
          <BsRecordCircleFill />&nbsp;
          {TIME_RANGE_STRICT}
        </Dropdown.Item>
        <Dropdown.Item onClick={setSelector.bind(this, TIME_RANGE_STRICT)} href="#">
          <BsRecordCircle />&nbsp;
          {TIME_RANGE_FILE}
        </Dropdown.Item>
      </DropdownButton>
      <InputGroup>
        <InputGroup.Text id="min-date-text">Min date</InputGroup.Text>
        <Form.Control
          ref={inputRef}
          aria-label="Min date"
          value={minDate}
          placeholder="e.g. 1970-12-31T23:59 (at least a year with 4 digits)"
          onChange={
            (e) => {
              (setMinDate(e.target.value));
            }
          }
        />
      </InputGroup>
      <div className="text-danger">
        {minDateErrorMessage}&nbsp;
      </div>
      <InputGroup>
        <InputGroup.Text id="max-date-text">Max date</InputGroup.Text>
        <Form.Control
          aria-label="Max date"
          value={maxDate}
          placeholder="e.g. 1970-12-31T23:59 (at least a year with 4 digits)"
          onChange={(e) => setMaxDate(e.target.value)}
        />
      </InputGroup>
      <div className="text-danger">
        {maxDateErrorMessage}
        &nbsp;
      </div>
      {applyButton}
    </div>
  );
}


TimeRangeSelector.propTypes = {
  databrowser: PropTypes.object,
  dispatch: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  databrowser: state.databrowserReducer
});

export default connect(mapStateToProps)(TimeRangeSelector);