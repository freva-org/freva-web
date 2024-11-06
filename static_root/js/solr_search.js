let visualSearch;
const cache = {};

/*
 * Used inside freva for file-browsing in solr when creating a new
 * plugin run
 */

const solr = new (function () {
  this.url = "/api/freva-nextgen/databrowser/extended_search/freva/file/";

  //maximum number of files that will be allowed to be selected
  //should be setup before displaying the find window
  this.max_files = 1;

  this.last = null;

  //where the results will be displayed (textarea or text field)
  this.target_container = null;

  //The current file selection (might add other metadata)
  this.result = {
    files: [],
  };
  this.init = function () {
    $("#selection").text(
      "Please select up to " +
        (solr.max_files - solr.result.files.length) +
        " file(s)."
    );
  };
  this.get_search_query = function () {
    const query = [];
    visualSearch.searchQuery.facets().forEach((obj) => {
      for (const k in obj) {
        if (obj[k]) {
          query.push($.param(obj));
        }
      }
    });
    return query.join("&");
  };
  this.get_query_drill_level = function () {
    //probably not well done
    return visualSearch.searchQuery.facets().length;
  };
  this.get_facet_values = function (facet, text_query) {
    //var url = this.url + '&facet=' + facet + '&' + facet + '=*' + text_query + '*'
    if (!text_query) {
      const url = this.url + "?facets=" + facet + "&" + this.get_search_query();
      const answer = [];

      $.ajax(url, {
        async: false,
        dataType: "json",
        success(response) {
          if (facet in response.facets) {
            const values = response.facets[facet];
            for (let i = 0; i < values.length; i = i + 2) {
              answer.push({
                label: values[i] + " (" + parseInt(values[i + 1]) + ")",
                value: values[i],
              });
            }
          }
        },
      });

      this.last = answer;
    }
    return this.last;
  };

  this.get_all_facets = function () {
    const url = this.url + "?" + this.get_search_query();

    if (!(url in cache)) {
      const answer = [];
      $.ajax(url, {
        async: false,
        dataType: "json",
        success(response) {
          for (const facet in response.facets) {
            const values = response.facets[facet];
            let count = 0;
            for (let i = 0; i < values.length; i = i + 2) {
              count += parseInt(values[i + 1]);
            }
            //>2 because it's always a (value, count) pair
            if (count > 0 && values.length >= 2) {
              if (solr.get_query_drill_level() > 0) {
                answer.push(facet);
              } else {
                answer.push({
                  label: facet + " (" + count + ")",
                  value: facet,
                });
              }
            }
          }
        },
      });
      cache[url] = answer;
    }
    return cache[url];
  };

  this.get_files = function (start, rows) {
    if (!start) {
      start = 0;
    }
    if (!rows) {
      rows = 10;
    }
    this.rows = rows;

    const url =
      this.url +
      "?start=" +
      start +
      "&max-results=" +
      rows +
      "&" +
      this.get_search_query();
    $.ajax(url, {
      dataType: "json",
      success(response) {
        const items = response.search_results.map((x) => {
          const path = x.file;
          return `<tr>
              <td class="small"><input class="file" type="radio" name="file" value="${path}">
                ${path}
                </input>
              </td>
            </tr>`;
        });

        $("div.files")
          .empty()
          .append(
            $("<table/>", {
              html: items.join("\n"),
              class: "files alternate",
            })
          );

        const total = response.totalCount;
        $("#count").text("Showing " + items.length + " out of " + total);

        if (total + solr.result.files.length <= solr.max_files) {
          $("#all").removeAttr("disabled");
        } else {
          $("#all").attr("disabled", "");
        }
      },
    });
  };

  this.hide_dialog = function (files) {
    if (files && files.length > 0) {
      this.target_container.val(files[0]);
      $("#myModal_solr").modal("hide");
    }
  };
})();

$(document).ready(function () {
  visualSearch = VS.init({
    container: $(".visual_search"),
    query: "",
    callbacks: {
      search() {
        solr.get_files(0, 100);
      },
      facetMatches(callback) {
        callback(solr.get_all_facets());
      },
      valueMatches(facet, searchTerm, callback) {
        const facets = solr.get_facet_values(facet, searchTerm);
        callback(facets);
      },
    },
  });

  //solr done functionallity
  $("#solr_select_file").click(function () {
    //check if this is valid
    const files = $(".file:checked").map(function (i, t) {
      return t.value;
    });
    solr.hide_dialog(files);
  });

  //init the search so we have something to display immediately after the user click on find more
  //solr.get_files(0, 10);

  //Find More functionallity
  $(".button[id^=find_]").click(function () {
    const container = $("#files_" + $(this).attr("id").substring(5));
    //split and clean the result
    const files = $("td[name=selected_file]", container).map(function (i, td) {
      return $(td).text();
    });

    //Setup find object for this run
    solr.result.files = files;
    solr.target_container = container;
    solr.max_files = parseInt($(this).attr("data-amount"));

    //show find mask
    solr.show_dialog();
  });

  //some cosmetics
  //$('input:text').each(function(){this.style.width='90%';})
});
