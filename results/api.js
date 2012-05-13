{
    "title": "API",
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
