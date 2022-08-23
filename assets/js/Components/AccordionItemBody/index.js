import React, { useState } from "react";
import PropTypes from "prop-types";
import { FormControl, Tooltip, OverlayTrigger } from "react-bootstrap";


function AccordionItemBody (props) {
  const [filter, setFilter] = useState("");

  function handleChange (e) {
    setFilter(e.target.value);
  }

  function renderFilteredItems (filteredValues) {
    const { metadata, facetClick, eventKey } = props;
    return filteredValues.map((item, i) => {
      if (i % 2 === 1) {
        return null;
      }
      if (metadata && metadata[item]) {
        return (
          <div className="col-sm-6 col-md-3" key={item}>
            <OverlayTrigger overlay={<Tooltip>{metadata[item]}</Tooltip>}>
              <a
                href="#"
                onClick={
                  (e) => {
                    e.preventDefault();
                    facetClick(eventKey, item);
                    props.togglePanel();
                  }
                }
              >{item}</a>
            </OverlayTrigger>
            {" "}[{filteredValues[i + 1]}]
          </div>
        );
      }
      return (
        <div className="col-sm-6 col-md-3" key={item}>
          <a
            href="#"
            onClick={
              (e) => {
                e.preventDefault();
                facetClick(eventKey, item);
                if (props.togglePanel) {
                  props.togglePanel();
                }
              }
            }
          >{item}</a> [{filteredValues[i + 1]}]
        </div>
      );
    });
  }


  const { eventKey, value, metadata } = props;
  const filterLower = filter.toLowerCase();
  const filteredValues = [];
  for (let i = 0; i < value.length; i = i + 2) {
    const val = value[i];
    if (val.toLowerCase().indexOf(filterLower) !== -1 ||
        (metadata && metadata[val] && metadata[val].toLowerCase().indexOf(filterLower) !== -1)) {
      filteredValues.push(val);
      filteredValues.push(value[i + 1]);
    }
  }

  const filteredItems = renderFilteredItems(filteredValues);

  return (
    <div>
      <FormControl
        className="mb-2"
        id="search"
        type="text"
        placeholder={`Search ${eventKey} name`}
        onChange={handleChange}
      />
      <div className="row">
        {filteredItems}
      </div>
    </div>
  );

}

AccordionItemBody.propTypes = {
  eventKey: PropTypes.any,
  value: PropTypes.any,
  metadata: PropTypes.any,
  visible: PropTypes.any,
  facetClick: PropTypes.any,
  togglePanel: PropTypes.func
};

export default AccordionItemBody;