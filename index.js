/*  
              _                         _        
__      _____| |__  _ __ ___   __ _ ___| |_ __ _ 
\ \ /\ / / _ \ '_ \| '_ ` _ \ / _` / __| __/ _` |
 \ V  V /  __/ |_) | | | | | | (_| \__ \ || (_| |
  \_/\_/ \___|_.__/|_| |_| |_|\__,_|___/\__\__,_|
  
You finally said good bye to your IRC and switched to slack? Good choice!
The main purpose of this integration is to maintain a clan homepage. Why
use a CMS if you can simply write your webmasta and tell him what you want.

This Slack Integration allows you to store news and results of fun wars in
a json file. As as I said, the main purpose is to manage a clan page and I
think these 2 are the only things worth having a CMS.

Usage:

configure an outgoing webhook in slack, pointing to this service
write "webmasta: news VdH rocks" to add a new entry to your news-json

ToDo:

* checking for missing parameters

data from slack:

token=topsecret
team_id=T0001
channel_id=C2147483705
channel_name=test
timestamp=1355517523.000005
user_id=U2147483697
user_name=Steve
text=webmasta: What is the air-speed velocity of an unladen swallow?
trigger_word=webmasta:
*/

var config = require('./webmasta.config');
var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
//var validator = require("validator");
var app = express();

// backwards compatibility
var warpath = config.warpath;
var newspath = config.newspath;


// for debugging only
console.log("config: ");
console.log(config);



app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));


app.post('/webmasta', function (req, res) {
    function respHandler(data) {
        res.json({"text":data});
        res.end();
    }

    // writes the json und informs the user via respHandler
    function writeJSON(path, jsonstring) {
        fs.writeFile(path, JSON.stringify(jsonstring,null,4), function(err) {
          if(err) {
            console.log(err);
            respHandler(err.message);
          } else {
            respHandler("Die Datei " + path + " wurde verändert.");
          }
        });
    }

   if(req.body.token != config.slacktoken) { // PROD
     res.status(403).end();
	 return
	}
    // I am pretty sure there is a node module that does this more efficent ;)
    var slack = req.body.text.trim().substr(req.body.trigger_word.length).trim().split(" ");
    var keyword = slack[0];

    // wars - we get quite a complex string, e.g.:
    // webmasta: wars <clan>, <map>, <result>, <player1_name>, <player1_kills>, <player1_deaths>, <player2_name> ...
    //
    // at least 2 players are needed, 1on1 does not count
    if(keyword === "wars") {
        var warList = slack.slice(1).join(" ").split(',');
        if(warList.length < 8) { // 1on1 does not count
          respHandler("*Fehler!!!* zu wenig Parameter, richtiger Aufruf:\n webmasta: wars <clan>, <map>, <result>, <player1_name>, <player1_kills>, <player1_deaths>, <player2_name> ... ");
          return
        }
        // VdH is our clan, so I won't change the variable name, deal with it ;)
        var vdh = JSON.parse(fs.readFileSync(config.warpath, 'utf8'));
        var warEntry =  {
          "clan": warList[0].replace("&amp;","&"),
          "map":warList[1],
          "result":warList[2],
          "players":[],
          "timestamp": "" + req.body.timestamp
        };
        // for each player there are 3 values (name,kills,death)
        for(var i=3; i < warList.length; i=i+3) {
          warEntry.players.push({"nick":warList[i],"kills":warList[i+1],"deaths":warList[i+2]});
        }
        vdh.wars.push(warEntry);
        writeJSON(config.warpath,vdh);
    } else if (keyword === "news") {
        var vdh = JSON.parse(fs.readFileSync(config.newspath, 'utf8'));
        vdh.news.push({"text": slack.slice(1).join(" "), "user_name":req.body.user_name.toString(), "timestamp": "" + req.body.timestamp});
        writeJSON(config.newspath,vdh);
    } else if (keyword === "show") {
        if(slack[1] === "news") {
            var vdh = JSON.parse(fs.readFileSync(config.newspath, 'utf8'));
            respHandler("Letzter Eintrag: " + JSON.stringify(vdh.news.pop()));
        } else if(slack[1] === "wars") {
            var vdh = JSON.parse(fs.readFileSync(config.warpath, 'utf8'));
            respHandler("Letzter Eintrag: " + JSON.stringify(vdh.wars.pop(),null,2));
        }
    } else if (keyword === "delete") {
        if(slack[1] === "news") {
            var vdh = JSON.parse(fs.readFileSync(config.newspath, 'utf8'));
            vdh.news = vdh.news.slice(0,-1)
            writeJSON(config.newspath,vdh);
        }
        if(slack[1] === "wars") {
            var vdh = JSON.parse(fs.readFileSync(config.warpath, 'utf8'));
            vdh.wars = vdh.wars.slice(0,-1)
            writeJSON(config.warpath,vdh);
        }
    } else if (keyword === "player") {
        var stats = [0,0];
        var found = false;
        if(!fs.existsSync(config.warpath)) {
            respHandler("Schwerer Ausnahmefehler, " + config.warpath + " ist nicht am Server vorhanden");
            return
        }
        var vdh = JSON.parse(fs.readFileSync(config.warpath, 'utf8'));
        //console.log(vdh)
        for (var i in vdh.wars) {
          for (var j in vdh.wars[i].players ) {
             //console.log(vdh.wars[i].players[j].nick);
             if(vdh.wars[i].players[j].nick === slack[1]) {
                 //console.log(vdh.wars[i].players[j].nick + " " + vdh.wars[i].players[j].kills);
                 stats[0] += parseInt(vdh.wars[i].players[j].kills);
                 stats[1] += parseInt(vdh.wars[i].players[j].deaths);
                 //console.log(stats)
                 found = true;
             }
           }
         }
        if(found) {
          respHandler("Statistik von " + slack[1]  + ": *" + stats[0] + "-" + stats[1] + "* Ratio: *" + (Math.round((stats[0]/stats[1])*100)/100) + "* Differenz: *" + (stats[0]-stats[1]) + "*" );
         // console.log("Stats von " + slack[1]  + ": *" + stats[0] + "-" + stats[1] + "* Ratio: *" + (stats[0]/stats[1]) + "* Differenz: *" + (stats[0]-stats[1]) + "*" );
        }
        else
          respHandler("Keine Statistiken zu " + slack[1] + " verfügbar");
    } else {
        respHandler(keyword + " ist kein gültiger Befehl! derzeit sind \nplayer <nick>\n show {news|wars}\n delete {news|wars}\n news <text> \n wars <clan>, <map>, <result>, <player1_name>, <player1_kills>, <player1_deaths>, <player2_name> ... \n verfügbar");
    }
   //console.log(req.body);
})



var server = app.listen(4711, function () {

  var host = server.address().address
  var port = server.address().port

  console.log('Webmasta listening at http://%s:%s', host, port)

})
