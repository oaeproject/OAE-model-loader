/*
 * Copyright 2012 Sakai Foundation (SF) Licensed under the
 * Educational Community License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License. You may
 * obtain a copy of the License at
 * 
 *     http://www.osedu.org/licenses/ECL-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS"
 * BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

/**
 * Render a chart for the retrieved data. This data will include an overview of the total
 * number of requests per second, an overview of the total number of requests per second
 * per feed, an overview of the overall average latency per second, and an overview of the 
 * overall average latency per second per feed.
 * @param {Object}      data        Output from the data loader. There will be a results key
 *                                  that contains an array that has 1 element for each of the
 *                                  charts that need to be generated.
 */
var renderCharts = function(data) {
    for (var i = 0; i < data.results.length; i++) {
        // Add a container
        var $container = $('<div>').attr('id', 'chart' + i).addClass('telemetry_chart');
        $('#telemetry_results_container').append($container);
        // Render the chart
        var chart = new Highcharts.Chart({
            chart: {
                renderTo: 'chart' + i,
                zoomType: 'x',
                spacingRight: 20
            },
            title: {
                text: 'Model Loader'
            },
            xAxis: {
                categories: []
            },
            plotOptions: {
                area: {
                    lineWidth: 1
                }
            },
            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'top',
                x: -10,
                y: 100,
                borderWidth: 0
            },
            series: data.results[i]
        });
    }
}  
    
/**
 * Retrieve the telemetry data
 */
var getTelemetryData = function() {
    $.ajax({
        url: '/telemetry.json',
        dataType: 'json',
        success: renderCharts
    });
};

$(document).ready(getTelemetryData);