var resultData = {};

/**
 * Render the top navigation based on the tests in the suite
 */
var renderNavigation = function() {
    $.each(resultData.results, function(i, result) {
        $('#reporting_navigation_container').append(
            $('<li><a href="#' + result.title + '" data-toggle="tab">' + result.title + '</a></li>')
        );
    });
};

/**
 * Render the different test suites and their results
 */
var renderTestSuites = function() {
    var htmlOutput = '';
    $.each(resultData.results, function(i, result) {
        htmlOutput += '<div class="reporting_test_suite" data-title="' + result.title + '"><div class="navbar"><div class="navbar-inner"><div class="container">' +
        '<a name="' + result.title + '" class="brand">' + result.title + '</a></div></div></div><div class="reporting_results" style="display:none">';

        // Add an 'overall' section to all suites
        htmlOutput += '<div class="well"><h3>Overall</h3></div>';

        $.each(result.elements, function(ii, test) {
            htmlOutput += '<div class="well"><h3>' + test.title + '</h3></div>';
        });
        htmlOutput += '</div></div>';
    });
    $('#reporting_results_container').append(htmlOutput);
};

/**
 * Retrieve the test data
 */
var getData = function() {
    $.ajax({
        url: '/results.json',
        success: function(data) {
            resultData = data;
            renderNavigation();
            renderTestSuites();
            addBinding();
        }
    })
};

/**
 * Add binding to various elements in the UI
 */
var addBinding = function() {
    $('.reporting_test_suite .navbar').on('click', function() {
        $(this).next('.reporting_results').toggle();
    });
    $(window).on('hashchange', function(a,b,c){
        $('.reporting_test_suite[data-title="' + window.location.hash.replace('#','') + '"] .navbar + .reporting_results').show();
    });
};

$(document).ready(getData);