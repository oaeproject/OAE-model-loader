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
        htmlOutput += '<div class="reporting_test_suite"><div class="navbar"><div class="navbar-inner"><div class="container">' + 
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
    resultData = { "results" : [{
            "title": "API",
            "threshold": 90,
            "target": 100,
            "elements": [
                {
                    "id": "createworld",
                    "title": "Worlds - Create a new world",
                    "targetAverage": 5000,
                    "upperLimitAverage": 10000,
                    "tolerance": 0.05,
                    "weight": 1
                },
                {
                    "id": "invitecontact",
                    "title": "Contacts - Invite a contact",
                    "targetAverage": 500,
                    "upperLimitAverage": 2000,
                    "tolerance": 0.05,
                    "weight": 2
                }
            ],
            "runs": [
                {
                    "id": "id0123456789",
                    "users": 1000,
                    "results": [
                        {
                            "type": "createworld",
                            "user": "user1",
                            "result": 5302
                        },
                        {
                            "type": "invitecontact",
                            "user": "user1",
                            "result": 356
                        },
                        {
                            "type": "createworld",
                            "user": "user2",
                            "result": 7800
                        },
                        {
                            "type": "invitecontact",
                            "user": "user2",
                            "result": 390
                        }
                    ]
                },
                {
                    "id": "id987654321",
                    "users": 2000,
                    "results": [
                        {
                            "type": "createworld",
                            "user": "user1",
                            "result": 6401
                        },
                        {
                            "type": "invitecontact",
                            "user": "user1",
                            "result": 420
                        },
                        {
                            "type": "createworld",
                            "user": "user2",
                            "result": 6800
                        },
                        {
                            "type": "invitecontact",
                            "user": "user2",
                            "result": 410
                        }
                    ]
                },
                {
                    "id": "id918273745",
                    "users": 3000,
                    "results": [
                        {
                            "type": "createworld",
                            "user": "user1",
                            "result": 12893
                        },
                        {
                            "type": "invitecontact",
                            "user": "user1",
                            "result": 510
                        },
                        {
                            "type": "createworld",
                            "user": "user2",
                            "result": 14932
                        },
                        {
                            "type": "invitecontact",
                            "user": "user2",
                            "result": 495
                        }
                    ]
                }
            ]
        }
        ,{
            "title": "Search",
            "threshold": 90,
            "target": 100,
            "elements": [
                {
                    "id": "searchall-all",
                    "title": "Search All - No Query",
                    "targetAverage": 500,
                    "upperLimitAverage": 2000,
                    "tolerance": 0.05,
                    "weight": 2
                },
                {
                    "id": "searchall-lots",
                    "title": "Search All - Query - Lots of results",
                    "targetAverage": 500,
                    "upperLimitAverage": 2000,
                    "tolerance": 0.05,
                    "weight": 1
                }
            ],
            "runs": [
                {
                    "id": "id0123456789",
                    "users": 1000,
                    "results": [
                        {
                            "type": "searchall-all",
                            "user": "user1",
                            "result": 179
                        },
                        {
                            "type": "searchall-lots",
                            "user": "user1",
                            "result": 356
                        },
                        {
                            "type": "searchall-all",
                            "user": "user2",
                            "result": 210
                        },
                        {
                            "type": "searchall-lots",
                            "user": "user2",
                            "result": 390
                        }
                    ]
                },
                {
                    "id": "id987654321",
                    "users": 2000,
                    "results": [
                        {
                            "type": "searchall-all",
                            "user": "user1",
                            "result": 219
                        },
                        {
                            "type": "searchall-lots",
                            "user": "user1",
                            "result": 756
                        },
                        {
                            "type": "searchall-all",
                            "user": "user2",
                            "result": 256
                        },
                        {
                            "type": "searchall-lots",
                            "user": "user2",
                            "result": 850
                        }
                    ]
                },
                {
                    "id": "id918273745",
                    "users": 3000,
                    "results": [
                        {
                            "type": "searchall-all",
                            "user": "user1",
                            "result": 345
                        },
                        {
                            "type": "searchall-lots",
                            "user": "user1",
                            "result": 2256
                        },
                        {
                            "type": "searchall-all",
                            "user": "user2",
                            "result": 390
                        },
                        {
                            "type": "searchall-lots",
                            "user": "user2",
                            "result": 2190
                        }
                    ]
                }
            ]
        }]};
};

/**
 * Add binding to various elements in the UI
 */
var addBinding = function() {
    $('.reporting_test_suite .navbar').on('click', function() {
        $(this).next('.reporting_results').toggle();
    });
};

/**
 * Initialize the UI
 */
var doInit = function() {
    getData();
    renderNavigation();
    renderTestSuites();
    addBinding();
};

$(document).ready(doInit);