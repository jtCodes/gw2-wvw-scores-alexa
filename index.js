const https = require('https');
const Alexa = require('alexa-sdk');
const Promise = require('promise');
const APP_ID = '';

exports.handler = function (event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

const worldId = {
    "anvil rock": 1001, "borlis pass": 1002, "yaks bend": 1003, "henge of denravi": 1004,
    "maguuma": 1005, "sorrows furnace": 1006, "gate of madness": 1007, "jade quarry": 1008,
    "fort aspenwood": 1009, "ehmry bay": 1010, "stormbluff isle": 1011, "darkhaven": 1012,
    "sanctum of rall": 1013, "crystal desert": 1014, "isle of janthir": 1015, "sea of sorrows": 1016,
    "tarnished coast": 1017, "northern shiverpeaks": 1018, "blackgate": 1019, "fergusons crossing": 1020,
    "dragonbrand": 1021, "kaineng": 1022, "devonas rest": 1023, "eredon Terrace": 1024
}
const worldNames = {
    1001: "Anvil Rock", 1002: "Borlis Pass", 1003: "Yaks Bend", 1004: "Henge of Denravi",
    1005: "Maguuma", 1006: "Sorrow's Furnace", 1007: "Gate of Madness", 1008: "Jade Quarry",
    1009: "Fort Aspenwood", 1010: "Ehmry Bay", 1011: "Stormbluff Isle", 1012: "Darkhaven",
    1013: "Sanctum of Rall", 1014: "Crystal Desert", 1015: "Isle of Janthir", 1016: "Sea of Sorrows",
    1017: "Tarnished Coast", 1018: "Northern Shiverpeaks", 1019: "Blackgate", 1020: "Fergusons Crossing",
    1021: "Dragonbrand", 1022: "Kaineng", 1023: "Devonas Rest", 1024: "Eredon Terrace"
}
var points = { "green": 0, "blue": 0, "red": 0 }
var matchUpIDs = { "green": 0, "blue": 0, "red": 0 }
var matchUpNames = { "green": '', "blue": '', "red": '' }

function getWorldInfo(key, id) {
    https.get('https://api.guildwars2.com/v2/worlds?ids=' + id, (res) => {

        res.on('data', (d) => {
            var obj = JSON.parse(d);
            matchUpNames[key] = obj[0].name
        });
    }).on('error', (e) => {
        console.error(e);
    });
}
function getWorldColor(name, fn) {
    var id = worldId[name]
    console.log(name)
    console.log(id)
    var myWorld = '';
    https.get('https://api.guildwars2.com/v2/wvw/matches/overview?world=' + id, (res) => {

        res.on('data', (d) => {
            var obj = JSON.parse(d);
            /*
            Object.keys(obj.all_worlds).forEach(function (key) {
                for (var i = 0; i < obj.all_worlds[key].length; i++) {
                    if (obj.all_worlds[key][i] == id) {
                        myWorld = key;
                    }
                }
            });
            */
            console.log(obj)
            Object.keys(obj.worlds).forEach(function (key) {
                matchUpIDs[key] = obj.worlds[key]
                matchUpNames[key] = worldNames[obj.worlds[key]]
            });
            fn()
        });

    }).on('error', (e) => {
        console.error(e);
    });
}

function getPoints(name, fn) {
    var id = worldId[name]
    var score = 0;

    https.get('https://api.guildwars2.com/v2/wvw/matches/scores?world=' + id, (res) => {
        var data = []
        res.on('data', (d) => {
            data.push(d);
        });
        res.on('end', function () {
            var result = JSON.parse(data.join(''))
            Object.keys(result.victory_points).forEach(function (key) {
                points[key] = result.victory_points[key]
            });
            fn()
        });
    }).on('error', (e) => {
        console.error(e);
    });
}
var handlers = {
    'LaunchRequest': function () { //Executes when a new session is launched
        this.emit('LaunchIntent');
    },

    'LaunchIntent': function () {
        this.emit(':ask', "Hi, please say the name of the world you want the score of.");
    },

    'ScoreIntent': function () {
        var waitFor;
        var self = this;
        var world = this.event.request.intent.slots.name.value;
        console.log(world)
        if (world in worldId) {
            getWorldColor(world, function () {
                getPoints(world, function () {
                    var speechOutput = "Your world is " + world + ', the scores of your worlds match up are, ' + matchUpNames.green + ', ' +
                        points.green + ', ' + matchUpNames.blue + ', ' + points.blue + ', ' + matchUpNames.red + ', ' + points.red
                    self.emit(':tell', speechOutput)
                })
            })
        }
        else {
            self.emit(':ask', "Sorry, I didn't get that. Please say the name of the world you want the score of.");
        }
    },

    'AMAZON.CancelIntent': function () {
        // Use this function to clear up and save any data needed between sessions
        this.emit(":tell", "Okay, canceled.");
    },

    'AMAZON.HelpIntent': function () {
        var helpspeech = "Please say the name of the world you want the score of. For example, what is the score for blackgate?"
        this.emit(':ask', helpspeech);

    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', "Goodbye");
    },
    'Unhandled': function () {
        this.emit(':ask', 'I didn\'t get that.', 'please tell me which world you want the score of');
    },

};

