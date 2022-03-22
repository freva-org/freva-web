import React from "react";
import PropTypes from "prop-types";
import { FormControl, Tooltip, OverlayTrigger } from "react-bootstrap";


class AccordionItemBody extends React.Component {

  constructor (props, context) {
    super(props, context);
    this.state = { needle: "" };

    this.handleChange = this.handleChange.bind(this);
  }


  shouldComponentUpdate (nextProps) {
    return this.props.visible || nextProps.visible;
  }

  handleChange (e) {
    this.setState({ needle: e.target.value });
  }

  renderFilteredItems (filteredValues) {
    const { metadata, facetClick, eventKey } = this.props;
    return filteredValues.map((item, i) => {
      if (i % 2 === 1) {
        return null;
      }
      if (metadata && metadata[item]) {
        return (
          <div className="col-sm-6 col-md-3" key={item}>
            <OverlayTrigger overlay={<Tooltip>{metadata[item]}</Tooltip>}>
              <a
                href="#" onClick={
                  (e) => {
                    e.preventDefault(); facetClick(eventKey, item);
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
            href="#" onClick={
              (e) => {
                e.preventDefault(); facetClick(eventKey, item);
              }
            }
          >{item}</a> [{filteredValues[i + 1]}]
        </div>
      );
    });
  }

  render () {

    const { eventKey, value, metadata } = this.props;
    let { needle } = this.state;
    needle = needle.toLowerCase();
    const filteredValues = [];

    value.forEach((val, i) => {
      if (i % 2 === 1) {
        return;
      }
      if (val.toLowerCase().indexOf(needle) !== -1 || (metadata && metadata[val] && metadata[val].toLowerCase().indexOf(needle) !== -1)) {
        filteredValues.push(val);
        filteredValues.push(value[i + 1]);
      }
    });

    const filteredItems = this.renderFilteredItems(filteredValues);

    return (
      <div>
        <FormControl
          className="mb-2" id="search" type="text" placeholder={`Search ${eventKey} name`}
          onChange={this.handleChange}
        />
        <div className="row">
          {filteredItems}
        </div>
      </div>
    );

  }
}

AccordionItemBody.propTypes = {
  eventKey: PropTypes.any,
  value: PropTypes.any,
  metadata: PropTypes.any,
  visible: PropTypes.any,
  facetClick: PropTypes.any,
};

export default AccordionItemBody;