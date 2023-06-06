/* eslint-disable no-unused-vars */
/* eslint-disable import/named */
/* eslint-disable react/prop-types */
import React from "react";
import RDropdown, {
  StylesConfig,
  GroupBase,
  Props,
  components,
  IndicatorsContainerProps,
  IndicatorSeparatorProps,
  OptionsOrGroups,
} from "react-select";

import AsyncSelect from "react-select/async";
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

const CustomMenuList = (props) => {
  const itemHeight = 35;
  const { options, children, maxHeight, getValue } = props;
  const [value] = getValue();
  const initialOffset = options.indexOf(value) * itemHeight;
  if (!Array.isArray(children) || children.length <= 1) {
    return <components.MenuList {...props} />;
  }
  return (
    <div>
      <List
        height={isNaN(maxHeight) ? 0 : maxHeight}
        itemCount={children.length}
        itemSize={itemHeight}
        initialScrollOffset={initialOffset}
      >
        {({ index, style }) => <div style={style}>{children[index]}</div>}
      </List>
    </div>
  );
};

// type TMarkerProps = Partial<{
//   border: string;
//   borderColor: Color;
//   backgroundImage: string;
//   backgroundRepeat: string;
//   backgroundPosition: string;
//   backgroundSize: string;
//   ":hover": {
//     borderColor: Color;
//   };
//   boxShadow: string;
// }>;

export default function Select(props) {
  /* instanceId receives some arbitrary text.
     it seems react-select has some issues
     with SSR and needs a custom instanceId to work
     properly..
  */
  const customStyles = {
    menu: (provided, state) => ({
      ...provided,
      color: state.selectProps.menuColor,
      zIndex: 4,
    }),
    control: (provided, state) => {
      let markerProps;
      if (state.selectProps.isInvalid) {
        markerProps = {
          borderColor: "#dc3545",
          backgroundImage:
            "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23dc3545' stroke='none'/%3e%3c/svg%3e\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right calc(3.375em + 0.1875rem) center",
          //        "boxShadow": "0 0 0 0.25rem rgba(220, 53, 69, 0.25)",
          backgroundSize: "calc(0.75em + 0.375rem) calc(0.75em + 0.375rem)",
          ":hover": {
            borderColor: "#dc3545",
          },
        };
      } else if (state.selectProps.isRequired) {
        markerProps = {
          border: "1px solid #ced4da",
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' height='12px' width='16px'><text x='0' y='16' fill='red' font-size='20'>*</text></svg>\")",
          backgroundPosition: "right 2.75rem center, center right 2.25rem",
          backgroundSize:
            "16px 12px, calc(0.75em + 0.375rem) calc(0.75em + 0.375rem)",
          backgroundRepeat: "no-repeat",
          boxShadow: "",
        };
      } else {
        markerProps = {
          border: "1px solid #ced4da",
        };
      }
      if (state.isFocused) {
        markerProps.border = state.selectProps.isInvalid
          ? "1px solid #dc3545"
          : "1px solid #0a58ca";
        markerProps.boxShadow = state.selectProps.isInvalid
          ? "0 0 0 0.25rem rgba(220, 53, 69, 0.25)"
          : "0 0 0 0.25rem rgba(0,81,145,.25)";
      }

      return {
        ...provided,
        ...markerProps,
      };
    },

    singleValue: (provided, state) => {
      const opacity = state.isDisabled ? 0.5 : 1;
      // We crop the width as we added an icon for these two cases
      // for which we don't want to see a text overflow
      const width =
        state.selectProps.isInvalid || state.selectProps.isRequired
          ? "calc(100% - 31px)"
          : "100%";
      const transition = "opacity 300ms";

      return { ...provided, opacity, transition, width };
    },

    valueContainer: (provided) => {
      const paddingTop = "0.75em";
      const paddingBottom = "0.75em";
      return { ...provided, paddingBottom, paddingTop };
    },

    dropdownIndicator: (provided) => ({
      ...provided,
      color: "#212529",
    }),
  };

  // if ("isAsync" in props) {
  //   return (
  //     <AsyncSelect
  //       components={{
  //         ...props.components,
  //         IndicatorsContainer,
  //       }}
  //       styles={customStyles}
  //       instanceId={props.instanceId}
  //       options={
  //         // showOptions || props.minimumInputLength === undefined
  //         props.options
  //         // : []
  //       }
  //       value={props.value}
  //       defaultOptions={props.defaultOptions}
  //       onBlur={props.onBlur}
  //       onChange={props.onChange}
  //       onInputChange={props.onInputChange}
  //       defaultValue={props.defaultValue}
  //       isClearable={props.isClearable}
  //       placeholder={props.placeholder}
  //       filterOption={props.filterOption}
  //       isRequired={props.isRequired}
  //       isInvalid={props.isInvalid}
  //       prependButton={props.prependButton}
  //       loadOptions={
  //         // showOptions || props.minimumInputLength === undefined
  //         // ?
  //         props.loadOptions
  //         // : undefined
  //       }
  //       noOptionsMessage={
  //         props.noOptionsMessage
  //         // (inputValue: string) => {
  //         // return props.noOptionsMessage
  //         // // ? props.noOptionsMessage({ inputValue })
  //         // return !showOptions && props.minimumInputLength !== undefined
  //         //   ? `Please type at least ${props.minimumInputLength} characters for suggestions`
  //         //   : "No options!";
  //         // }
  //       }
  //     />
  //   );
  // }
  console.log("opts", props.options.length);
  return (
    <RDropdown
      components={{
        ...props.components,
        IndicatorsContainer,
        MenuList:
          props.options.length < 20 ? components.MenuList : CustomMenuList,
      }}
      styles={customStyles}
      instanceId={props.instanceId}
      options={props.options}
      value={props.value}
      onBlur={props.onBlur}
      onChange={props.onChange}
      isClearable={false}
      isMulti={props.isMulti}
      filterOption={props.filterOption}
      placeholder={props.placeholder}
      isRequired={props.isRequired}
      isInvalid={props.isInvalid}
      defaultValue={props.defaultValue}
      prependButton={props.prependButton}
      controlShouldRenderValue={false}
    />
  );
}
