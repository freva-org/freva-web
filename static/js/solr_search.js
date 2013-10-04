
var tmp;
var visualSearch;
var cache = {};
var solr;

solr = new function() {
    this.url = '/plugins/solr-search/';
    
    //maximum number of files that will be allowed to be selected
    //should be setup before displaying the find window
    this.max_files = 1;
    
    //default text search
    this.q = '*:*';
    
    
    this.last = null;
    
    //where the results will be displayed (textarea or text field)
    this.target_container = null;
    
    //The current file selection (might add other metadata)
    this.result = {
            files: []
    };
    this.init = function() {
        $('#selection').text('Please select up to ' + (solr.max_files-solr.result['files'].length) + ' file(s).')
    };
    this.get_search_query= function() {
        var query = [];
        $.each(visualSearch.searchQuery.facets(), function(pos, obj) {
            for (var k in obj){
                if (obj[k]){
                    query.push($.param(obj))                    
                }
            }
        });
        return query.join('&');
    };
    this.get_query_drill_level=function() {
        //probably not well done
        return visualSearch.searchQuery.facets().length;
    };
    this.get_facet_values = function(facet, text_query) {
        //var url = this.url + '&facet=' + facet + '&' + facet + '=*' + text_query + '*'
        if (!text_query) {
            var url = this.url + '?facet=' + facet + '&' + this.get_search_query()
            var answer = [];
            
            var acall = $.ajax(url, {
                async:false,
                dataType: 'json',
                success: function(response){
                    if (facet in response['data']) {
                        var values = response['data'][facet];
                        var i = 0;
                        for (var i = 0; i<values.length;i++) {
                            if (i % 2 == 0) {
                                answer.push({
                                    label: values[i] + ' (' + values[i+1] + ')',
                                    value: values[i]});
                            }
                        }
                    }
                }
            });
            
            this.last = answer
            
        }
        return this.last;
    };
    
    this.get_all_facets = function() {
        var url = this.url + '?facet=*&' + this.get_search_query();
        
        if (!(url in cache)) {
        
            var answer = [];
            var acall = $.ajax(url, {
                async:false,
                dataType: 'json',
                success: function(response){
                    for (facet in response['data']) {
                        var values = response['data'][facet];
                        var count = 0;
                        for (var i = 0; i<values.length;i++) {
                            if (i % 2 == 0) {
                                count +=values[i+1];
                            }
                        }
                        //>2 because it's always a (value, count) pair
                        if (count > 0 && values.length > 2) {
                            if (solr.get_query_drill_level() > 0) {
                                answer.push(facet);                             
                            } else {
                                  answer.push({label:facet + ' (' + count + ')', value:facet});
                            }
                        }
                    }
                }
            });
            cache[url] = answer;
        }
        return cache[url];
    };
    
    this.get_files = function(start, rows) {
        if (!start){ start=0;}
        if (!rows){ rows=10;}
        this.rows = rows;
        
        var url = this.url + '?start=' + start + '&rows=' + rows + '&' + this.get_search_query();
        $.ajax(url, {
            dataType: 'json',
            success: function(response){ 
                var items = [];
                
                $.each(response['data'], function(pos, path) {
                    items.push('<tr><td><input class="file" type="checkbox" name="file" value="' + path + '"> ' + path + '</input></td></tr>');
                });
                
                $('div.files').empty().append(
                $('<table/>', {
                     html: items.join('\n'),
                     'class': 'files alternate'
                }));
                
                var total = response['metadata']['numFound']
                $('#count').text('Showing '+  items.length + ' out of ' + total)
                
                if (total + solr.result['files'].length <= solr.max_files) {
                    $('#all').removeAttr('disabled')
                } else {
                    $('#all').attr('disabled', '')
                }
                //remove all selection
                $('input:checkbox').each(function(i){ this.checked = false});
                $('#select_all:button').val('Select all')   
                $('#select_all:button').val('Select all')
            }
        });
    }
    
    this.show_dialog = function() {
        //init 
        this.init()
        
        var maskHeight = $(document).height();
        var maskWidth = $(window).width();
        //Set heigth and width to mask to fill up the whole screen
        $('#mask').css({'width':maskWidth,'height':maskHeight});
        
        //transition effect     
        $('#mask').fadeIn(1000);    
        $('#mask').fadeTo("slow",0.8);
        
        //Get the window height and width
        var winH = $(window).height();
        var winW = $(window).width();
        
        //Set the popup window to center
        $('#dialog').css('top',  winH/2-$('#dialog').height()/2);
        $('#dialog').css('left', winW/2-$('#dialog').width()/2);
        
        //transition effect
        $('#dialog').fadeIn(2000); 
    }
    this.hide_dialog = function(files) {
        if (files && files.length > 0) {
            if (files.length + this.result['files'].length > this.max_files) {
                alert("Sorry, you may select at most " + this.max_files + " file(s).")
                return;
            } else {
                $.merge(this.result['files'], files);
                var file_entries = [];
                //get the variable id from the container
                var variable_id = this.target_container.attr('id').substring(6);
                this.result['files'].each(function(i, f){
                    file_entries.push(
                         $('<tr/>').append([
                                $('<td/>', {name:'selected_file', html:f}).append(
                                               $('<input/>', {
                                            	   name:variable_id,
                                            	   type:'hidden',
                                                   value:f})),
                                $('<td/>').append($('<a/>', {html:'Del',href:'#'}).click(remove_file_from_list))
                                        ])
                               )});
                this.target_container.empty().append(
                        $('<table/>', {'class': 'alternate'}).append(file_entries));
            }
            
            //check if max number of files was reached (container name is files_<name>)
            var button = $('#find_' + this.target_container.attr('id').substring(6));
            check_find_more_status(button);
        }
        //transition effect
        $('#dialog').fadeOut(1000);
        $('#mask').fadeOut(1000);
    }

}

$(document).ready(function() {
    visualSearch = VS.init({
      container : $('.visual_search'),
      query     : '',
      callbacks : {
        search       : function(query, searchCollection) {
            solr.get_files(0, 10);
        },
        facetMatches : function(callback) {
            callback(solr.get_all_facets());
                  },
        valueMatches : function(facet, searchTerm, callback) {
            var facets = solr.get_facet_values(facet, searchTerm);
            callback(facets);
        }
      }
    });
    
    //Select all functionality
    $('#select_all:button').click(function(){
        if ( $(this).val() == 'Select all') {
            $('input:checkbox').each(function(i){ this.checked = true});
            $(this).val('Deselect all')
        } else {
            $('input:checkbox').each(function(i){ this.checked = false});
            $(this).val('Select all')           
        }
    });

    //solr done functionallity
    $('#done:button').click(function(){
        //check if this is valid
        var files = $('.file:checked').map(function(i, t){return t.value});
        solr.hide_dialog(files);
    });
    //solr Get all files functionallity
    $('#all').click(function(){
    	// we are going to retrieve the maximum number of files from a direct query
    	var url = solr.url + 'start=' + 0 + '&rows=' + solr.max_files + '&' + solr.get_search_query();
        $.ajax(url, {
            dataType: 'json',
            success: function(response){
            	solr.hide_dialog(response['data']);
            }
        });
    });
    //solr cancel 
    $('#cancel:button').click(function(){
    	solr.hide_dialog();
    });
    
    //init the search so we have something to display immediately after the user click on find more
    //solr.get_files(0, 10);


    //Find More functionallity 
    $('.button[id^=find_]').click(function(e){
    	var container =$('#files_' + $(this).attr('id').substring(5));
    	//split and clean the result
    	var files = $('td[name=selected_file]', container).map(function(i, td){return $(td).text()})
    	
    	
    	//Setup find object for this run
    	solr.result['files'] = files;
    	solr.target_container = container;
    	solr.max_files = parseInt($(this).attr('data-amount')) 
    	
    	//show find mask
    	solr.show_dialog();
   	});
    $('.button[id^=find_]').each(function(){
    	check_find_more_status($(this));
    });

    

    				
    //some cosmetics
    $('input:text').each(function(){this.style.width='90%';})
    

    
});



  
function check_find_more_status(button) {
    var max_files = parseInt($(button).attr('data-amount'));
    var container =$('#files_' + $(button).attr('id').substring(5));
    var current_count = $('td[name=selected_file]', container).map(function(i, td){return $(td).text()}).length;
    if (current_count >= max_files) {
        $(button).attr('disabled', '');
    } else {
    	$(button).removeAttr('disabled');
    }
	
}
  


function send() {
    $.each($("input"), function(index, input_elem) {
        if (input_elem.value == "") {
            tmp += input_elem.name + ", ";
        }
    });
    if (validate()) {
        alert(tmp);
    };
    
};

