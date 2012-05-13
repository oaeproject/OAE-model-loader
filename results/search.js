{
    "title": "Search",
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
}