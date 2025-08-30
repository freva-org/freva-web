export const LOAD_FACETS = "LOAD_FACETS";

export const LOAD_FILES = "LOAD_FILES";

export const UPDATE_FACET_SELECTION = "UPDATE_FACET_SELECTION";

export const SET_METADATA = "SET_METADATA";

export const SET_FLAVOURS = "SET_FLAVOURS";

export const SET_FILE_LOADING = "SET_FILE_LOADING";

export const LOAD_NCDUMP = "LOAD_NCDUMP";
export const LOAD_NCDUMP_SUCCESS = "LOAD_NCDUMP_SUCCESS";
export const LOAD_NCDUMP_ERROR = "LOAD_NCDUMP_ERROR";
export const RESET_NCDUMP = "RESET_NCDUMP";

export const TIME_RANGE_FLEXIBLE = "flexible";
export const TIME_RANGE_STRICT = "strict";
export const TIME_RANGE_FILE = "file";

export const BBOX_RANGE_FILE = "file";
export const BBOX_RANGE_FLEXIBLE = "flexible";
export const BBOX_RANGE_STRICT = "strict";

export const DEFAULT_FLAVOUR = window.DEFAULT_FLAVOUR || "freva";

export const BATCH_SIZE = 100;
export const ViewTypes = {
  RESULT_CENTERED: "RESULT_CENTERED",
  FACET_CENTERED: "FACET_CENTERED",
};

export const STREAM_CATALOGUE_MAXIMUM = 100_000;
export const AVAILABLE_FACETS = [
  { key: "project", label: "Project" },
  { key: "model", label: "Model" },
  { key: "experiment", label: "Experiment" },
  { key: "variable", label: "Variable" },
  { key: "institute", label: "Institute" },
  { key: "time_frequency", label: "Time Frequency" },
  { key: "cmor_table", label: "CMOR Table" },
  { key: "ensemble", label: "Ensemble" },
  { key: "fs_type", label: "File System Type" },
  { key: "grid_label", label: "Grid Label" },
  { key: "product", label: "Product" },
  { key: "realm", label: "Realm" },
  { key: "time_aggregation", label: "Time Aggregation" },
  { key: "dataset", label: "Dataset" },
  { key: "driving_model", label: "Driving Model" },
  { key: "format", label: "Format" },
  { key: "grid_id", label: "Grid ID" },
  { key: "level_type", label: "Level Type" },
  { key: "rcm_name", label: "RCM Name" },
  { key: "rcm_version", label: "RCM Version" },
  { key: "user", label: "User" },
];

export const TEMP_FREVA_AUTH_TOKEN = "freva_auth_token=";
