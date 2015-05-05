# Webmasta
  
You finally said good bye to your IRC and switched to slack? Good choice!  The main purpose of this integration is to maintain a clan homepage. Why use a CMS if you can simply write your webmasta and tell him what you want.

This Slack Integration allows you to store news and results of fun wars in a json file. As as I said, the main purpose is to manage a clan page and I think these 2 are the only things worth having a CMS.  


## Usage:

edit the config, you need a valid newspath, warpath and slacktoken.
```bash
npm start
```

and you are good to go.

To get a valid slack token, you need to configure an outgoing webhook in Slack, pointing to this service

In Slack write 
```pre
webmasta: news very important update aka hello world!
```


to add a new entry to your news-json


example entry of the news.json:
```json
{
    "news": [
        {
            "text": "very important update aka hello world!",
            "user_name": "your slack user_name",
            "timestamp": "1422020396.000017"
        }
    ]
}
```

a news.json and wars.json is provided, you may also want to look at http://vdh.g0t.it ;)

## ToDo:

* checking for missing parameters



