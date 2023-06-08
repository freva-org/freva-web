import React from "react";
import PropTypes from "prop-types";
import RDropdown, { components, createFilter } from "react-select";

import { FixedSizeList as List } from "react-window";

function IndicatorsContainer({ children, ...props }) {
  return (
    <components.IndicatorsContainer {...props}>
      {children}
      {props.selectProps.prependButton && (
        <>
          <components.IndicatorSeparator {...props} />
          {props.selectProps.prependButton}
        </>
      )}
    </components.IndicatorsContainer>
  );
}

IndicatorsContainer.propTypes = {
  children: PropTypes.any,
  selectProps: PropTypes.object,
};

const OPTION_HEIGHT = 35;
const ROWS = 7;

const CustomMenuList = ({ options, children, getValue }) => {
  const [value] = getValue();
  const initialOffset =
    options.indexOf(value) !== -1
      ? Array.isArray(children) && children.length >= ROWS
        ? options.indexOf(value) >= ROWS
          ? options.indexOf(value) * OPTION_HEIGHT - OPTION_HEIGHT * 5
          : 0
        : 0
      : 0;

  return Array.isArray(children) ? (
    <List
      height={
        children.length >= ROWS
          ? OPTION_HEIGHT * ROWS
          : children.length * OPTION_HEIGHT
      }
      itemCount={children.length}
      itemSize={OPTION_HEIGHT}
      initialScrollOffset={initialOffset}
    >
      {({ style, index }) => {
        return <div style={style}>{children[index]}</div>;
      }}
    </List>
  ) : (
    <div>{children}</div>
  );
};

CustomMenuList.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
  options: PropTypes.object.isRequired,
  getValue: PropTypes.func.isRequired,
};

// const CustomMenuList = (props) => {
//   const itemHeight = 35;
//   const { options, children, maxHeight, getValue } = props;
//   const [value] = getValue();
//   const initialOffset = options.indexOf(value) * itemHeight;
//   if (!Array.isArray(children) || children.length <= 1) {
//     return <components.MenuList {...props} />;
//   }
//   return (
//     <div>
//       <List
//         height={isNaN(maxHeight) ? 0 : maxHeight}
//         itemCount={children.length}
//         itemSize={itemHeight}
//         initialScrollOffset={initialOffset}
//       >
//         {({ index, style }) => <div style={style}>{children[index]}</div>}
//       </List>
//     </div>
//   );
// };

export default function Select(props) {
  const customStyles = {
    menu: (provided, state) => ({
      ...provided,
      color: state.selectProps.menuColor,
      zIndex: 4,
    }),
    control: (provided, state) => {
      const markerProps = {
        border: "1px solid #ced4da",
        ":hover": {
          borderColor: "#90959b",
        },
      };
      if (state.isFocused) {
        markerProps.border = "1px solid #c0c5cb";
        markerProps.boxShadow = "0 0 0 0.25rem rgba(130,139,146,.25)";
      }

      return {
        ...provided,
        ...markerProps,
      };
    },
    option: (provided, state) => {
      const markerProps = {};
      if (state.isSelected) {
        markerProps.backgroundColor = "#e0e5eb";
        markerProps.color = "#000000";
      } else if (state.isFocused) {
        markerProps.backgroundColor = "#f0f5fb";
      }
      return { ...provided, ...markerProps };
    },

    valueContainer: (provided) => {
      const paddingTop = "0.75em";
      const paddingBottom = "0.75em";
      return { ...provided, paddingBottom, paddingTop };
    },

    dropdownIndicator: (provided) => ({
      ...provided,
      color: "#002529",
    }),
  };

  return (
    <RDropdown
      components={{
        ...props.components,
        IndicatorsContainer,
        MenuList: CustomMenuList,
      }}
      classNamePrefix="react-select"
      styles={customStyles}
      instanceId={props.instanceId}
      options={props.options}
      value={props.value}
      onBlur={props.onBlur}
      onChange={props.onChange}
      isClearable={false}
      isMulti={props.isMulti}
      filterOption={createFilter({ ignoreAccents: false })}
      placeholder={props.placeholder}
      isRequired={props.isRequired}
      isInvalid={props.isInvalid}
      defaultValue={props.defaultValue}
      prependButton={props.prependButton}
      controlShouldRenderValue={false}
    />
  );
}

Select.propTypes = {
  instanceId: PropTypes.string,
  components: PropTypes.object,
  options: PropTypes.arrayOf(PropTypes.object),
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  isInvalid: PropTypes.bool,
  isRequired: PropTypes.bool,
  isMulti: PropTypes.bool,
  placeholder: PropTypes.node,
  defaultValue: PropTypes.string,
  prependButton: PropTypes.node,
  value: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.object),
    PropTypes.object,
  ]),
};
