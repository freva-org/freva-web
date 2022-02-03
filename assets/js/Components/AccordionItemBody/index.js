import React from "react";
import ReactDOM from "react-dom";
import { Row, Col, FormControl, Tooltip, OverlayTrigger } from "react-bootstrap";


class AccordionItemBody extends React.Component {

  constructor (props, context) {
    super(props, context);
    this.state = {needle: ""};
  }

  handleChange () {
    const needle = ReactDOM.findDOMNode(this.refs.searchInput).value;
    this.setState({needle});
  }

  shouldComponentUpdate (nextProps) {
    return this.props.visible || nextProps.visible;
  }

  renderFilteredItems (filteredValues) {
    const {metadata, facetClick, eventKey} = this.props;
    return filteredValues.map((item, i) => {
      if (i % 2 == 0) {
        if (metadata && metadata[item]) {
          return (
            <div className="pe-2" key={item}>
              <OverlayTrigger overlay={<Tooltip>{metadata[item]}</Tooltip>}>
                <a href="#" onClick={(e) => {e.preventDefault(); facetClick(eventKey, item);}}>{item}</a>
              </OverlayTrigger>
              {" "}[{filteredValues[i + 1]}]
            </div>
          );
        }
        return (
          <div className="pe-2" key={item}>
            <a href="#" onClick={(e) => {e.preventDefault(); facetClick(eventKey, item);}}>{item}</a> [{filteredValues[i + 1]}]
          </div>
        );
      }
    });
  }

  render () {
    const {eventKey, value, metadata} = this.props;
    let {needle} = this.state;
    needle = needle.toLowerCase();
    const filteredValues = [];
    value.map((val, i) => {
      if (i % 2 == 0) {
        if (val.toLowerCase().indexOf(needle) !== -1 || (metadata && metadata[val] && metadata[val].toLowerCase().indexOf(needle) !== -1)) {
          filteredValues.push(val);
          filteredValues.push(value[i + 1]);
        }

      }
    });

    const filteredItems = this.renderFilteredItems(filteredValues);

    return (
      <div>
        <FormControl
          className="mb-2" id="search" type="text" placeholder={`Search ${eventKey} name`} ref="searchInput"
          onChange={() => this.handleChange()}
        />
        <div className="d-flex justify-content-start flex-wrap">
          {filteredItems}
        </div>
      </div>
    );

  }
}

export default AccordionItemBody;