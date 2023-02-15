import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { withRouter } from "react-router";
import queryString from "query-string";
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

// import { setTimeRange } from "./actions";
import { TIME_RANGE_FILE, TIME_RANGE_FLEXIBLE, TIME_RANGE_STRICT } from "./constants";

const dateRegex = /^[-]?\d{4}(-[01]\d(-[0-3]\d(T[0-2]\d(:[0-5]\d)?Z?)?)?)?$/;

function TimeRangeSelector ({ databrowser, router, location }) {
  const [selector, setSelector] = useState(TIME_RANGE_FLEXIBLE);
  const [minDate, setMinDate] = useState("");
  const [maxDate, setMaxDate] = useState("");

  useEffect(() => {
    setMinDate(databrowser.minDate);
    setMaxDate(databrowser.maxDate);
    setSelector(databrowser.dateSelector);
  }, [databrowser]);

  function applyChanges () {
    const currentLocation = location.pathname;

    const { dateSelector: ignore1, minDate: ignore2, maxDate: ignore3, ...queryObject } = location.query;
    const query = queryString.stringify({ ...queryObject, minDate, maxDate, dateSelector: selector });
    router.push(currentLocation + "?" + query);
  }

  function onKeyPress (errorMessage, e) {
    const enterKey = 13;
    if (!errorMessage && e.charCode === enterKey) {
      applyChanges();
    }
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

  let errorMessage = "";
  if (maxDate.length < 4 || minDate.length < 4) {
    errorMessage = "Both date must consist of at least a year information with four digits";
  } else if (minDateErrorMessage) {
    errorMessage = minDateErrorMessage;
  } else if (maxDateErrorMessage) {
    errorMessage = maxDateErrorMessage;
  }

  let applyButton;
  if (errorMessage) {
    const tooltip = (
      <Tooltip id="boxWarning"> {errorMessage} </Tooltip>
    );
    applyButton = (
      <OverlayTrigger overlay={tooltip} placement="top">
        <span>
          <Button variant="danger" disabled>
            Apply
          </Button>
        </span>
      </OverlayTrigger>);
  } else {
    applyButton = (
      <Button variant="primary" onClick={applyChanges.bind(this)}>
        Apply
      </Button>
    );
  }

  return (
    <div onKeyPress={onKeyPress.bind(this, errorMessage)}>
      <InputGroup className="mb-4">
        <InputGroup.Text id="min-date-text">Operator</InputGroup.Text>
        <DropdownButton
          className="selector-button"
          variant="outline-secondary"
          title={selector}
          id="time-operator-dropdown"
        >
          <Dropdown.Item onClick={setSelector.bind(this, TIME_RANGE_FLEXIBLE)} href="#">
            <BsCircleSquare />&nbsp;
            {TIME_RANGE_FLEXIBLE}
          </Dropdown.Item>
          <Dropdown.Item onClick={setSelector.bind(this, TIME_RANGE_STRICT)} href="#">
            <BsRecordCircleFill />&nbsp;
            {TIME_RANGE_STRICT}
          </Dropdown.Item>
          <Dropdown.Item onClick={setSelector.bind(this, TIME_RANGE_FILE)} href="#">
            <BsRecordCircle />&nbsp;
            {TIME_RANGE_FILE}
          </Dropdown.Item>
        </DropdownButton>
      </InputGroup>

      <InputGroup>
        <InputGroup.Text id="min-date-text">Min date</InputGroup.Text>
        <Form.Control
          aria-label="Min date"
          value={minDate}
          placeholder="e.g. 1970-12-31T23:59 (at least a year with 4 digits)"
          onChange={
            (e) => {
              setMinDate(e.target.value);
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
  location: PropTypes.object.isRequired,
  router: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  databrowser: state.databrowserReducer
});

export default withRouter(connect(mapStateToProps)(TimeRangeSelector));