import _ from "lodash";

import * as constants from "./constants";

const pluginListInitialState = {
  pluginsLoaded: false,
  plugins: [],
  filteredPlugins: [],
  exported: null,
  tags: [],
  categories: {},
  categoriesFilter: [],
  tagsFilter: [],
  searchFilter: ""
};

function sortObject (o) {
  return Object.keys(o).sort().reduce((r, k) => (r[k] = o[k], r), {});
}

const createCategories = plugins => {
  const categories = {};
  plugins.forEach(p => {
    const newCat = p[1].category ? p[1].category : "other";
    p[1].category = newCat;
    let cat = categories[newCat];
    if (cat) {
      cat.push(p[1].name);
    } else {
      cat = [p[1].name];
    }
    categories[newCat] = cat;
  });
  return sortObject(categories);
};

const createTags = plugins => {
  let tags = [];
  plugins.forEach(p => {
    if (p[1].tags) {
      tags = tags.concat(p[1].tags);
    }
  });
  return _.sortBy(_.uniq(tags));
};

const filterPlugins = (plugins, categoriesFilter, tagsFilter, searchFilter) => {
  let filteredPlugins = plugins;
  // filter for categories
  if (categoriesFilter.length > 0) {
    filteredPlugins = _.filter(filteredPlugins, (p) => {
      return _.includes(categoriesFilter, p[1].category);
    });
  }

  // filter for tags
  // tool must have ALL tags
  if (tagsFilter.length > 0) {
    filteredPlugins = _.filter(filteredPlugins, (p) => {
      for (let i = 0; i < tagsFilter.length; i++) {
        if (!_.includes(p[1].tags, tagsFilter[i])) {
          return false;
        }
      }
      return true;
    });
  }

  // filter for string
  filteredPlugins = _.filter(filteredPlugins, (p) => {
    const title = _.includes(p[1].name.toLowerCase(), searchFilter.toLowerCase());
    const description = _.includes(p[1].description.toLowerCase(), searchFilter.toLowerCase());
    let tags = false;
    if (p[1].tags) {
      tags = _.includes(p[1].tags.join().toLowerCase(), searchFilter.toLowerCase());
    }
    return title || description || tags;
  });
  return filteredPlugins;
};


export const pluginListReducer = (state = pluginListInitialState, action) => {
  switch (action.type) {
    case constants.FILTER_PLUGINS: {
      const filteredPlugins = filterPlugins([...state.plugins], state.categoriesFilter, state.tagsFilter, state.searchFilter);
      return { ...state, filteredPlugins, tags: createTags(filteredPlugins) };
    }
    case constants.LOAD_PLUGINS: {
      const exported = action.payload.some(v => {
        return v[1].user_exported;
      });
      return {
        ...state,
        plugins: action.payload,
        exported,
        categories: createCategories(action.payload),
        tags: createTags(action.payload),
        filteredPlugins: filterPlugins(action.payload, state.categoriesFilter, state.tagsFilter, state.searchFilter),
        pluginsLoaded: true
      };
    }
    case constants.UPDATE_CATEGORY_FILTER: {
      const { categoriesFilter } = state;
      if (_.includes(categoriesFilter, action.category)) {
        _.pull(categoriesFilter, action.category);
      } else {
        categoriesFilter.push(action.category);
      }
      return { ...state, categoriesFilter };
    }
    case constants.UPDATE_TAG_FILTER: {
      const { tagsFilter } = state;
      if (_.includes(tagsFilter, action.tag)) {
        _.pull(tagsFilter, action.tag);
      } else {
        tagsFilter.push(action.tag);
      }
      return { ...state, tagsFilter };
    }
    case constants.UPDATE_SEARCH_FILTER:
      return { ...state, searchFilter: action.value };
    default:
      return state;
  }
};
