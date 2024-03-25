import queryString from "query-string";

import * as constants from "./constants";

export function prepareSearchParams(location, additionalParams = "") {
  let params = "";
  let flavourValue = constants.DEFAULT_FLAVOUR;
  if (location) {
    const queryObject = location.query;
    const { dateSelector, minDate, maxDate, flavour, ...facets } = queryObject;
    flavourValue = flavour ?? flavourValue;
    params = queryString.stringify(facets);

    if (params && additionalParams) {
      params = "&" + params;
    }

    const isDateSelected = !!minDate;
    if (isDateSelected) {
      params += `&time_select=${dateSelector}&time=${minDate} TO ${maxDate}`;
    }
  }
  return `${flavourValue}/file?${additionalParams}${params}`;
}
