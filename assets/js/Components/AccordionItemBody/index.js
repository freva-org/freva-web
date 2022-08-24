import React, { useState } from "react";
import PropTypes from "prop-types";
import { FormControl, Tooltip, OverlayTrigger } from "react-bootstrap";
import { VariableSizeList as List } from "react-window";

function AccordionItemBody (props) {
  const [filter, setFilter] = useState("");

  function handleChange (e) {
    setFilter(e.target.value);
  }

  function renderFilteredItems (filteredValues) {
    const { metadata, facetClick, eventKey } = props;
    return filteredValues.map((item) => {
      const value = item.value;
      const count = item.count;
      if (metadata && metadata[value]) {
        return (
          <div className="col-md-12 col-sm-6" key={value}>
            <OverlayTrigger overlay={<Tooltip>{metadata[value]}</Tooltip>}>
              <a
                href="#"
                onClick={
                  (e) => {
                    e.preventDefault();
                    facetClick(eventKey, value);
                    props.togglePanel();
                  }
                }
              >{value}</a>
            </OverlayTrigger>
            {" "}[{count}]
          </div>
        );
      }
      return (
        <div className="col-md-12 col-sm-6" key={value}>
          <a
            href="#"
            onClick={
              (e) => {
                e.preventDefault();
                facetClick(eventKey, value);
                if (props.togglePanel) {
                  props.togglePanel();
                }
              }
            }
          >{value}</a> [{item.count}]
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
      filteredValues.push({ "value":val, "count": value[i + 1] });
    }
  }

  const filteredItems = renderFilteredItems(filteredValues);
  const eventKeyId = eventKey.replaceAll(/\s/g, "_") + "_hiddenID";
  return (
    <div>
      <FormControl
        className="mb-2"
        id="search"
        type="text"
        placeholder={`Search ${eventKey} name`}
        onChange={handleChange}
      />
      <div id={eventKeyId} style={{ visibility: "visible", whiteSpace: "normal" }} />
      {
        filteredItems.length <= 12 ? (
          filteredItems
        ) : (
          <List
            className="infinite-body"
            height={338}
            itemData={filteredItems}
            itemCount={filteredItems.length}
            itemSize={(i) => onGetItemSize(filteredValues[i], eventKeyId)}
          >
            {ItemRenderer}
          </List>
        )
      }
    </div>
  );

}

function onGetItemSize (row, hiddenFieldName) {
  const text = `${row.value} [${row.count}]`;
  const rowHeight = 28;
  // if no text, or text is short, don't bother measuring.
  if (!text || text.length < 20) {
    return rowHeight;
  }

  // // attempt to measure height by writting text to a, kind of hidden element.
  const hiddenElement = document.getElementById(hiddenFieldName);
  if (hiddenElement) {
    hiddenElement.textContent = text;
    const ret = hiddenElement.offsetHeight;
    hiddenElement.textContent = "";

    if (ret > 0) {
      return Math.max(ret, rowHeight);
    }
  }

  return rowHeight;
}

AccordionItemBody.propTypes = {
  eventKey: PropTypes.any,
  value: PropTypes.any,
  metadata: PropTypes.any,
  visible: PropTypes.any,
  facetClick: PropTypes.any,
  togglePanel: PropTypes.func
};

class ItemRenderer extends React.PureComponent {
  static propTypes = {
    data: PropTypes.array.isRequired,
    index: PropTypes.number.isRequired,
    style: PropTypes.any
  }

  render () {
    // Access the items array using the "data" prop:
    const item = this.props.data[this.props.index];
    return <div style={this.props.style}>{item}</div>;
  }
}

export default AccordionItemBody;