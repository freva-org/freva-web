/* eslint-disable no-unused-vars */
import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { FormControl, Tooltip, OverlayTrigger, Badge } from "react-bootstrap";
import { VariableSizeList as List } from "react-window";

/**
 * The row-virtualization implemented above by the
 * <List>-Tags needs to know the exact size of each
 * single element in it.
 *
 * This component measures the height of a single element
 * inside the facet-dropdown by putting the text of this
 * element into a more or less hidden element
 * (elemRef, which is created in OwnPanel) and then
 * measure the height of this element. This is necessary
 * as not every element has the same height due to possible
 * line breaks if a facet has a longer name.
 */
const Row = ({ data, index, setSize, windowWidth, rowData, elemRef }) => {
  React.useEffect(() => {
    const text = `${rowData.value} [${rowData.count}]`;
    let rowHeight = 28;
    // if no text, or text is short, don't bother measuring.
    if (text && text.length > 20) {
      // attempt to measure height by writing text to a kind of hidden element.
      if (elemRef) {
        elemRef.current.textContent = text;
        const ret = elemRef.current.offsetHeight;
        elemRef.current.textContent = "";

        if (ret > 0) {
          rowHeight = Math.max(ret, rowHeight);
        }
      }
    }

    setSize(index, rowHeight);
  }, [setSize, index, windowWidth]);

  return <React.Fragment>{data[index]}</React.Fragment>;
};

Row.propTypes = {
  data: PropTypes.array,
  rowData: PropTypes.shape({
    value: PropTypes.string,
    count: PropTypes.number,
  }),
  elemRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  ]),
  index: PropTypes.number,
  setSize: PropTypes.func,
  windowWidth: PropTypes.number,
};

export const useWindowSize = () => {
  const [size, setSize] = useState([0, 0]);
  useLayoutEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);
  return size;
};

function AccordionItemBody(props) {
  const listRef = useRef();
  const sizeMap = useRef({});
  const setSize = useCallback((index, size) => {
    sizeMap.current = { ...sizeMap.current, [index]: size };
    listRef.current.resetAfterIndex(index);
  }, []);
  const [filter, setFilter] = useState("");

  function handleChange(e) {
    setFilter(e.target.value);
  }

  function renderFilteredItems(filteredValues) {
    const { metadata, facetClick, eventKey } = props;
    return filteredValues.map((item) => {
      const value = item.value;
      const count = item.count;
      let renderedElem;
      const badge = (
        <div>
          <Badge bg="secondary d-flex align-items-center">{count}</Badge>
        </div>
      );
      const link = (
        <a
          href="#"
          className="text-wrap"
          onClick={(e) => {
            e.preventDefault();
            facetClick(eventKey, value);
            if (props.togglePanel) {
              props.togglePanel();
            }
          }}
        >
          {value}
        </a>
      );
      if (metadata && metadata[value]) {
        renderedElem = (
          <React.Fragment>
            <OverlayTrigger
              overlay={
                <Tooltip>
                  <div dangerouslySetInnerHTML={{ __html: metadata[value] }} />
                </Tooltip>
              }
            >
              {link}
            </OverlayTrigger>
            {badge}
          </React.Fragment>
        );
      } else {
        renderedElem = (
          <React.Fragment>
            {link}
            {badge}
          </React.Fragment>
        );
      }
      return (
        <div
          className={
            "col-md-" +
            (props.isFacetCentered ? "3" : "12") +
            " col-sm-6 forced-textwrap d-flex justify-content-between"
          }
          key={value}
        >
          {renderedElem}
        </div>
      );
    });
  }

  const { eventKey, value, metadata } = props;
  const filterLower = filter.toLowerCase();
  const filteredValues = [];
  for (let i = 0; i < value.length; i = i + 2) {
    const val = value[i];
    if (
      val.toLowerCase().indexOf(filterLower) !== -1 ||
      (metadata &&
        metadata[val] &&
        metadata[val].toLowerCase().indexOf(filterLower) !== -1)
    ) {
      filteredValues.push({ value: val, count: value[i + 1] });
    }
  }

  const filteredItems = renderFilteredItems(filteredValues);
  const [windowWidth] = useWindowSize();
  const getSize = (index) => sizeMap.current[index] || 24;

  return (
    <div
      className={props.isFacetCentered ? "row" : ""}
      style={
        props.isFacetCentered ? { overflowY: "auto", maxHeight: "450px" } : {}
      }
    >
      <div>
        <FormControl
          className="my-2"
          id="search"
          type="text"
          placeholder={`Search ${eventKey} name`}
          onChange={handleChange}
        />
      </div>

      {filteredItems.length <= 12 || props.isFacetCentered ? (
        filteredItems
      ) : (
        <List
          ref={listRef}
          className="infinite-body"
          height={338}
          itemData={filteredItems}
          itemCount={filteredItems.length}
          itemSize={getSize}
          width="100%"
        >
          {({ data, index, style }) => (
            <div style={style}>
              <Row
                data={data}
                index={index}
                setSize={setSize}
                windowWidth={windowWidth}
                rowData={filteredValues[index]}
                elemRef={props.elemRef}
              />
            </div>
          )}
        </List>
      )}
    </div>
  );
}

AccordionItemBody.propTypes = {
  eventKey: PropTypes.string,
  value: PropTypes.array,
  isFacetCentered: PropTypes.bool,
  metadata: PropTypes.object,
  elemRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  ]),
  facetClick: PropTypes.func,
  togglePanel: PropTypes.func,
};

export default AccordionItemBody;
