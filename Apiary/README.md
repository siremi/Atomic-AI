FORMAT: 1A
HOST: https://app.atomicreach.com

# Atomic AI Platform

Developers API Documentation
http://docs.atomicreach.apiary.io

## Real Time Analyze Text API [/analyze-text/master]

### Analyze Text master [POST]

You can analyze a paragraph / text using this action.

+ Request (application/json)

        {
            "content": "Once there was a Czar who had three lovely daughters. One day the three daughters went walking in the woods. They were enjoying themselves so much that they forgot the time and stayed too long. A dragon kidnapped the three daughters. As they were being dragged off they cried for help. Three heroes heard their cries and set off to rescue the daughters. The heroes came and fought the dragon and rescued the maidens. Then the heroes returned the daughters to their palace. When the Czar heard of the rescue, he rewarded the heroes.",
            "serviceNamesArray": [
                "paragraph_density", // return paragraphDensityArray
                "sentence_length",   // returns sentenceLengthIssuesArray
                "spelling",          // returns issuesArray
                "grammar",           // returns issuesArray
                "readability",       // calculates Syntax / audience level of the text | automatically done if context / synonyms are enabled
                "synonyms_v3",       // returns synonymsV3
                "context",           // orders synonymsV3 by context on top
                "urls"               // checks links in html | returns urlsArray
            ],
            "sophisticationBandId": 4, // target audience level | 1,2,3,4,5 | optional | set to Knowledgeable by default
            "contentHtml": "" // optional, only required if urls service is active
        }

+ Response 200 (application/json)

    + Headers

            Location: /analyze-text/master

    + Body

            {
                "question": "Favourite programming language?",
                "published_at": "2015-08-05T08:40:51.620Z",
                "choices": [
                    {
                        "choice": "Swift",
                        "votes": 0
                    }, {
                        "choice": "Python",
                        "votes": 0
                    }, {
                        "choice": "Objective-C",
                        "votes": 0
                    }, {
                        "choice": "Ruby",
                        "votes": 0
                    }
                ]
            }