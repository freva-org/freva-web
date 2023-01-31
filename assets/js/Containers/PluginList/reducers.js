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

const OTHER_CATEGORY = "others";

function compareCategories (a, b) {
  const normalizedA = a.toLowerCase().trim();
  const normalizedB = b.toLowerCase().trim();
  if (normalizedA === OTHER_CATEGORY) {
    return 1;
  } else if (normalizedB === OTHER_CATEGORY) {
    return -1;
  }
  return a.localeCompare(b);
}

function sortCategories (o) {
  return Object.keys(o).sort(compareCategories).reduce((r, k) => (r[k] = o[k], r), {});
}

const createCategories = plugins => {
  const categories = {};
  plugins.forEach(p => {
    const plugin = p[1];
    const newCat = plugin.category;
    let cat = categories[newCat];
    if (cat) {
      cat.push(plugin.name);
    } else {
      cat = [plugin.name];
    }
    categories[newCat] = cat;
  });
  return sortCategories(categories);
};

const createTags = plugins => {
  let tags = [];
  plugins.forEach(p => {
    const plugin = p[1];
    if (plugin.tags) {
      tags = tags.concat(plugin.tags);
    }
  });
  return [...new Set(tags)].sort();
};

const filterPlugins = (plugins, categoriesFilter, tagsFilter, searchFilter) => {
  let filteredPlugins = plugins;
  // filter for categories
  if (categoriesFilter.length > 0) {
    filteredPlugins = filteredPlugins.filter(p => {
      return _.includes(categoriesFilter, p[1].category);
    });
  }

  // filter for tags
  // tool must have ALL tags
  if (tagsFilter.length > 0) {
    filteredPlugins = filteredPlugins.filter(p => {
      for (let i = 0; i < tagsFilter.length; i++) {
        if (!_.includes(p[1].tags, tagsFilter[i])) {
          return false;
        }
      }
      return true;
    });
  }

  // filter for string
  const searchWord = searchFilter.toLowerCase();
  filteredPlugins = filteredPlugins.filter(p => {
    const plugin = p[1];
    const title = _.includes(plugin.name.toLowerCase(), searchWord);
    const description = _.includes(plugin.description.toLowerCase(), searchWord);
    let tags = false;
    if (plugin.tags) {
      tags = _.includes(plugin.tags.join().toLowerCase(), searchWord);
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
      action.payload.forEach(p => {
        const plugin = p[1];
        if (!plugin.category) {
          plugin.category = OTHER_CATEGORY;
        }
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
