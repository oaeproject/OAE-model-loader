

///////////////
// VARIABLES //
///////////////

var resultData = {};


///////////////
// GRAPHING ///
///////////////

/**
 * Event handler for applying different colors above and below a threshold value.
 * Currently this only works in SVG capable browsers. A full solution is scheduled
 * for Highcharts 3.0. In the current example the data is static, so we don't need to
 * recompute after altering the data. In dynamic series, the same event handler
 * should be added to yAxis.events.setExtremes and possibly other events, like
 * chart.events.resize.
 */
var applyGraphGradient = function() {
    // Options
    var threshold = this.options.yAxis.threshold,
        colorAbove = '#EE4643',
        colorBelow = '#4572EE';

    // internal
    var series = this.series[0],
        i,
        point;

    if (this.renderer.box.tagName === 'svg') {
        var translatedThreshold = series.yAxis.translate(threshold),
            y1 = Math.round(this.plotHeight - translatedThreshold),
            y2 = y1 + 2; // 0.01 would be fine, but IE9 requires 2

        // Apply gradient to the path
        series.graph.attr({
            stroke: {
                linearGradient: [0, y1, 0, y2],
                stops: [
                    [0, colorAbove],
                    [1, colorBelow]
                ]
            }
         });
    }

    // Apply colors to the markers
    for (i = 0; i < series.data.length; i++) {
        point = series.data[i];
        point.color = point.y < threshold ? colorBelow : colorAbove;
        if (point.graphic) {
            point.graphic.attr({
                fill: point.color
            });
        }
    }

    // prevent the old color from coming back after hover
    delete series.pointAttr.hover.fill;
    delete series.pointAttr[''].fill;
};

/**
 * Creates a chart based on the data that is given to the function
 * @param {Object} chartData Variables used to render the plot
 */
var createChart = function(chartData) {
    var chart = new Highcharts.Chart({
        chart: {
            renderTo: chartData.chartId,
            type: 'spline',
            marginBottom: 25,
            width: 900,
            animate: false,
            th: chartData.treshold,
            events: {
                load: applyGraphGradient
            }
        },
        title: {
            text: chartData.chartTitle,
            x: -20 //center
        },
        subtitle: {
            text: chartData.subTitle,
            x: -20
        },
        xAxis: {
            categories: chartData.categories
        },
        yAxis: {
            title: {
                text: 'Average (ms)'
            },
            threshold: chartData.threshold, // Custom property for applyGraphGradient to work properly
            plotLines: [{
                value: chartData.threshold,
                width: 3,
                color: '#ff0000',
                label : {
                    text : 'Highest acceptable average'
                }
            }, {
                value: chartData.target,
                width: 3,
                color: '#00ff00',
                label : {
                    text : 'Target we aim for'
                }
            }]
        },
        tooltip: {
            formatter: function() {
                    return '<b>'+ this.series.name +'</b><br/>'+
                    this.x +': '+ this.y +' ms';
            }
        },
        legend: {
            enabled: false
        },
        series: chartData.series
    });
};

/**
 * Render the charts of all tests rendered on the page
 */
var renderCharts = function() {
    $.each(resultData.suites, function(i, result) {
        // Render overall results first
        var categories = [];
        var singleSerie = {
            'name': result.title + ' - Overall',
            'data': []
        };
        $.each(result.weighted, function(j, test) {
            categories.push(test.users);
            singleSerie.data.push(test.result);
        });
        createChart({
            chartId: 'reporting_chart_' + i + '_overall',
            chartTitle: result.title + ' - Overall',
            categories: categories,
            series: [singleSerie],
            threshold: result.threshold, // Highest acceptable average
            target: result.target // Target we aim for
        });

        // Render the runs
        $.each(result.elements, function(ii, test) {
            var categories = [];
            var singleSerie = {
                'name': i + ' - ' + test.title,
                'data': []
            };
            $.each(test.runs, function(iii, rA) {
                if (rA.users) {
                    categories.push(rA.users);
                }
                if (rA.average) {
                    singleSerie.data.push(rA.average);
                }
            });
            createChart({
                chartId: 'reporting_chart_' + i + '_' + test.id,
                chartTitle: test.title,
                categories: categories,
                series: [singleSerie],
                threshold: test.upperLimitAverage, // Highest acceptable average
                target: test.targetAverage // Target we aim for
            });
        });
    });
};


///////////////
// RENDERING //
///////////////

/**
 * Render the top navigation based on the tests in the suite
 */
var renderNavigation = function() {
    $.each(resultData.suites, function(i, result) {
        $('#reporting_navigation_container').append(
            $('<li><a href="#' + result.title + '" data-toggle="tab">' + result.title + '</a></li>')
        );
    });
};

var renderUsersSupported = function() {
    $('#reporting_users_supported').text(resultData.numberOfUsersSupported);
};

/**
 * Render the different test suites and their results
 */
var renderTestSuites = function() {
    var htmlOutput = '';
    $.each(resultData.suites, function(i, result) {
        htmlOutput += '<div class="reporting_test_suite" data-title="' + result.title + '"><div class="navbar"><div class="navbar-inner"><div class="container">' +
        '<a name="' + result.title + '" class="brand">' + result.title + '</a></div></div></div><div class="reporting_results" style="display:none">';

        // Add an 'overall' section to all suites
        htmlOutput += '<div class="well"><h3>Overall</h3><div id="reporting_chart_' + i + '_overall"></div></div>';

        $.each(result.elements, function(ii, test) {
            htmlOutput += '<div class="well"><h3>' + test.title + '</h3><div id="reporting_chart_' + i + '_' + test.id + '"></div></div>';
        });
        htmlOutput += '</div></div>';
    });
    $('#reporting_results_container').append(htmlOutput);
};


////////////////////
// INITIALIZATION //
////////////////////

/**
 * Retrieve the test data
 */
var getData = function() {
    $.ajax({
        url: '/results.json',
        success: function(data) {
            resultData = data;
            renderNavigation();
            renderUsersSupported();
            renderTestSuites();
            renderCharts();
            addBinding();
        }
    });
};

/**
 * Add binding to various elements in the UI
 */
var addBinding = function() {
    $('.reporting_test_suite .navbar').on('click', function() {
        $(this).next('.reporting_results').animate({
            'height': 'toggle'
        }, 500);
    });

    $(window).on('hashchange', function(a,b,c){
        $('.reporting_test_suite[data-title="' + window.location.hash.replace('#','') + '"] .navbar + .reporting_results').show();
    });
};

$(document).ready(getData);
