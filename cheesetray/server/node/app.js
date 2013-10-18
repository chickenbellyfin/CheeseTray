var http = require("http"),
    request = require("request"),
    twilio = require("twilio")("AC1d21bd011cde4a7b3dfb75855e519f79", "821baa85c4f5e8fd9fc514048437d913"),
    parseString = require('xml2js').parseString;

var echonest_key = "ILGNR3783M8V42MWM";
var gracenote_id = "7365632";
var gracenote_tag = "B7BDF1D4DC3B5917E888E00238E4E391";
var user_key = "264395586526618505-6E6B1B273FE1326DAB367235CC75FBFA";

var server = http.createServer().listen(8082),
	io = require("socket.io").listen(server, { log: false });

console.log("Started server");

function avg(list) {
	var sum = 0;
	for (var i = 0; i < list.length; i++) {
		sum += list[i];
	}
	return sum / list.length;
}

function stdDev(list) {
	var a = avg(list);
	var dist_sum = 0;
	for (var i = 0; i < list.length; i++) {
		dist_sum += Math.abs(list[i] - a);
	}
	return dist_sum / list.length;
}

// TODO: artist hotttnesss

io.sockets.on("connection", function(socket) {
    console.log("Client Connected");
    
    socket.on("getData", function(info) {
    	var json_info = JSON.parse(info);
    	//console.log("received data: " + info);
    	console.log("Received playlist info, analyzing...");
    	var info_types = [
    		"danceability",
    		"energy",
    		"speechiness",
    		"acousticness",
    		"liveness",
    		"tempo"
    	];
    	var values = {};
    	var value_stats = {};
		for (var t = 0; t < info_types.length; t++) {
			values[info_types[t]] = [];
			value_stats[info_types[t]] = {
				min: 0,
				max: 1
			};
		}
		var name = json_info.pname;
    	var songs = json_info.songs;
    	var artists = {};
    	var genres = {};
    	var hotttnessses = [];
    	var num_songs_anazlyzed = 0;
    	for (var i = 0; i < songs.length; i++) {
	        //console.log("analyzing " + songs[i].title + " by " + songs[i].artist);
    		var song_name = encodeURIComponent(songs[i].title);
			var artist_name = encodeURIComponent(songs[i].artist);
	        console.log("Analyzing " + song_name + " by " + artist_name);
	    	request("http://developer.echonest.com/api/v4/song/search?api_key=" + echonest_key + "&format=json&results=1&artist=" + artist_name + "&title=" + song_name + "&bucket=id:7digital-US&bucket=audio_summary&bucket=song_hotttnesss&limit=false", function(error, response, body) {
	    		//socket.emit("returnData", JSON.parse(body).response.songs[0].audio_summary[info_type]);
	    		//console.log("===============" + body);
	    		var response = JSON.parse(body).response;
	    		if (response.status.message != "Success") {
	    			console.log("Error getting song: " + response.status.message);
	    		}
	    		else {
	    			var song_search = response.songs;
		    		if (song_search.length != 0) {
		    			var summary = song_search[0].audio_summary;
		    			var art_id = song_search[0].artist_id;
		    			//console.log(JSON.stringify(summary, undefined, 2));
			    		for (var t = 0; t < info_types.length; t++) {
			    			values[info_types[t]][values[info_types[t]].length] = summary[info_types[t]];
			    		}
			    		//console.log("art id: " + art_id)
		    			if (Object.keys(artists).indexOf(art_id) == -1) {
		    				artists[art_id] = 1;
		    			}
		    			else {
		    				artists[art_id]++;
		    			}
				    	hotttnessses[hotttnessses.length] = song_search[0].song_hotttnesss;
			    	}
			    	num_songs_anazlyzed++;
			        //console.log("Analyzed " + num_songs_anazlyzed);
			        if (num_songs_anazlyzed == songs.length) {

			        	var num_artists_analyzed = 0;
			        	var as = Object.keys(artists);
			        	for (var a = 0; a < as.length; a++) {
			        		//console.log(as[a] + " " + name);
			        		request("http://developer.echonest.com/api/v4/artist/profile?api_key=" + echonest_key + "&format=json&id=" + as[a] + "&bucket=terms", function(error, response, body) {
			        			//console.log(as[a] + " " + name + " " + body);
					    		var response = JSON.parse(body).response;
					    		if (response.status.message != "Success") {
					    			console.log("Error getting artist: " + response.status.message);
					    		}
					    		else {
				        			var terms = response.artist.terms;
					    			for (var t = 0; t < terms.length; t++) {
					        			var term_name = terms[t].name;
					    				if (Object.keys(genres).indexOf(term_name) == -1) {
						    				genres[term_name] = 1;
						    			}
						    			else {
						    				genres[term_name]++;
						    			}
						    		}
						    		num_artists_analyzed++;
						    		if (num_artists_analyzed == as.length) {
									    console.log("Done");
										for (var t = 0; t < info_types.length; t++) {
											var a = avg(values[info_types[t]]);
											var sd = stdDev(values[info_types[t]]);
											value_stats[info_types[t]].min = Math.max(0, a - sd);
											value_stats[info_types[t]].max = info_types[t] == "tempo" ? a + sd : Math.min(1, a + sd);
										}

										var req = "http://developer.echonest.com/api/v4/song/search?api_key=" + echonest_key + "&format=json&results=1&bucket=id:7digital-US";

										var gs = Object.keys(genres);
										for (var g = 0; g < gs.length; g++) {
											req += "&style=" + encodeURIComponent(gs[g]);// + "^" + genres[g];
										}

										/*var avg_hot = avg(hotttnessses);
										var std_dev_hot = stdDev(hotttnessses);
										var min_hotttnesss = avg_hot - std_dev_hot;
										var max_hotttnesss = avg_hot + std_dev_hot;
										req += "&song_min_hotttnesss=" + encodeURIComponent(min_hotttnesss);
										req += "&song_max_hotttnesss=" + encodeURIComponent(max_hotttnesss);*/

										for (var t = 0; t < info_types.length; t++) {
											req += "&min_" + info_types[t] + "=" + encodeURIComponent(value_stats[info_types[t]].min);
											req += "&max_" + info_types[t] + "=" + encodeURIComponent(value_stats[info_types[t]].max);
										}
										//console.log("req: " + req);
										console.log(name + ": Finding song with attributes: " + JSON.stringify(value_stats, undefined, 2) + /*",\nhotttnesss " + min_hotttnesss + " to " + max_hotttnesss +*/ ",\nand genres: " + JSON.stringify(genres, undefined, 2));
										request(req, function(error, response, body) {
											//console.log(body);
											var response = JSON.parse(body).response;
								    		if (response.status.message != "Success") {
								    			console.log("Error getting average song: " + response.status.message);
								    		}
								    		else {
												var avg_song_search = response.songs;
												if (avg_song_search.length == 0) {
													console.log("No song found for " + name);
													socket.emit("returnData", { "pname": name, "title": "", "artist": "", "worked": false });
												}
												else {
													var artist_name = avg_song_search[0].artist_name;
													var song_title = avg_song_search[0].title;
													console.log("Found " + song_title + " by " + artist_name + " for " + name);

													console.log("sending gracenote req");

													var req =
"<QUERIES>"+
"  <AUTH>"+
"    <CLIENT>" + gracenote_id + "-" + gracenote_tag + "</CLIENT>"+
"    <USER>" + user_key + "</USER>"+
"  </AUTH>"+
"  <LANG>eng</LANG>"+
"  <COUNTRY>usa</COUNTRY>"+
"  <QUERY CMD=\"ALBUM_SEARCH\">"+
"    <MODE>SINGLE_BEST_COVER</MODE>"+
"    <TEXT TYPE=\"ARTIST\">" + artist_name + "</TEXT>"+
"    <TEXT TYPE=\"TRACK_TITLE\">" + song_title + "</TEXT>"+
"  </QUERY>"+
"</QUERIES>"
													//req = "";

													request.post(
													    {
													    	url: "https://c" + gracenote_id + ".web.cddbp.net/webapi/xml/1.0/",
													    	body: req,
													    	headers: {'Content-Type': 'text/xml'}
													    },
													    function (error, response, body) {     
													    	//console.log("bla: " + body);   
													        if (!error) {
																parseString(body, function (err, result) {
																	//console.log(JSON.stringify(result));
																    //console.log(result.reponses.response.url);

																    var albums = result.RESPONSES.RESPONSE[0].ALBUM;

																    if (albums != undefined) {
																	    var artwork_url = albums[0].URL[0]._;

																		console.log("Sending album artwork for " + song_title + ": \"" + artwork_url + "\"");
																		twilio.sendSms({

																		    to:'+17742582390', // Any number Twilio can deliver to
																		    from: '+17812147019', // A number you bought from Twilio and can use for outbound communication
																		    body: artwork_url.substring(40) // body of the SMS message
																		    //mediaUrl: avg_song_search[0].tracks[0].release_image

																		}, function(err, responseData) { //this function is executed when a response is received from Twilio

																		    if (!err) { // "err" is an error received during the request, if any

																		        // "responseData" is a JavaScript object containing data received from Twilio.
																		        // A sample response from sending an SMS message is here (click "JSON" to see how the data appears in JavaScript):
																		        // http://www.twilio.com/docs/api/rest/sending-sms#example-1

																		        console.log("reponse from: " + responseData.from); // outputs "+14506667788"
																		        console.log("reponse body: " + responseData.body); // outputs "word to your mother."

																				socket.emit("returnData", { "pname": name, "title": song_title, "artist": artist_name, "worked": true, "image": artwork_url });
																		    }
																		    else {
																		    	console.log("error sending sms: " + JSON.stringify(err));
																				socket.emit("returnData", { "pname": name, "title": song_title, "artist": artist_name, "worked": true });
																		    }
																		});
																	}
																	else {
																		console.log("could not find album artwork on gracenote");
																		socket.emit("returnData", { "pname": name, "title": song_title, "artist": artist_name, "worked": true });
																	}
																});
													        }
													        else {
													        	console.log("error connecting to gracenote");
																socket.emit("returnData", { "pname": name, "title": song_title, "artist": artist_name, "worked": true });
													        }
													    }
													);
												}
											}
										});
						    		}
						    	}
			        		});
			        	}
					}
				}
	    	});
	    }
	    console.log("Analyzing " + songs.length + " songs...");
	    //while (num_songs_anazlyzed < songs.length);
    });
});