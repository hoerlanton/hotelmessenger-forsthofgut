'use strict';

var express = require('express');
var router = express.Router();
var https = require('https');
var request = require('request');
var http = require('http');
var sourceFile = require('../app');
var cors = require('cors');
var bodyParser = require('body-parser');
var mongojs = require('mongojs');
var db = mongojs('mongodb://anton:b2d4f6h8@ds127132.mlab.com:27132/servicio', ['forsthofgutMessages', 'forsthofgutGaeste']);
var config = require('config');

//Bodyparser middleware
router.use(bodyParser.urlencoded({ extended: false}));

//Cors middleware
router.use(cors());

//Global variables
var errMsg = "";
var SERVER_URL = config.get('serverURL');
var newFileUploaded = false;


//----->REST-FUL API<------//

//Get all messages
router.get('/guestsMessages', function(req, res, next) {
    console.log("guestsMessages get called");
    //Get guests from Mongo DB
    db.testMessages.find(function(err, testMessage){
        if (err){
            res.send(err);
        }
        res.json(testMessage);
    });
});

//Get all guests
router.get('/guests', function(req, res, next) {
    console.log("guests get called");
    //Get guests from Mongo DB
    db.testGaeste.find(function(err, testGaeste){
        if (err){
            res.send(err);
        }
        res.json(testGaeste);
    });
});

//Save new guests
router.post('/guests', function(req, res, next) {
    //JSON string is parsed to a JSON object
    console.log("Post request made to ****Guest*****");
    console.dir(req.body);
    var guest = req.body;
    console.dir(guest);
    if(!guest.first_name || !guest.last_name){
        res.status(400);
        res.json({
            error: "Bad data"
        });
    } else {
        db.testGaeste.save(guest, function (err, guest) {
            if (err) {
                res.send(err);
            }
            res.json(guest);
        });
    }
});

//Update guest
router.put('/guests', function(req, res, next) {
    console.log("Put request made to ****Guest*****");
    console.log(req.body);
    var guestUpdate = req.body;
    var guestUpdateString = JSON.stringify(guestUpdate);
    var guestUpdateHoi = guestUpdateString.slice(2, -5);
    console.log(guestUpdateHoi);
    db.testGaeste.update({
        senderId:  guestUpdateHoi  },
        {
            $set: { signed_up: false }
        }, { multi: true }, function (err, testGaeste){
            if(err) {
                console.log("error: " + err);
            } else {
                console.log(testGaeste);
            }});
});

//Post message to guests
router.post('/guestsMessage', function(req, res, next){
    console.log(req.body);
    var message = req.body;
    console.log(message);
    var broadcast = req.body.text;
    var uploadedFileName = sourceFile.uploadedFileName;
    //Destination URL for uploaded files
    var URLUploadedFile = String(config.get('serverURL') + "/uploads/" + uploadedFileName);
    console.log("New file uploaded status:" + newFileUploaded);
    newFileUploaded = sourceFile.newFileUploaded;
    console.log("New file uploaded status: FINAALLLL!!!!" + newFileUploaded);
    console.log("UploadedFileName: FINAALLLL!!!!" + uploadedFileName);
    db.testGaeste.find(function(err, testGaeste){
        if (err){
            errMsg = "Das senden der Nachricht ist nicht möglich. Es sind keine Gäste angemeldet.";
        } else {
            for (var i = 0; i < testGaeste.length; i++) {
                if(testGaeste[i].signed_up === true) {
                    sourceFile.sendBroadcast(testGaeste[i].senderId, broadcast);
                    console.log("New file uploaded status: FINAALLLL!!!! ******" + newFileUploaded);
                    console.log("UploadedFileName: FINAALLLL!!!! ******" + uploadedFileName);
                    //If a new file got attached, also send the attachment
                    if(uploadedFileName !== undefined && newFileUploaded === true) {
                        console.log("sendbroadcastfile runned");
                        sourceFile.sendBroadcastFile(testGaeste[i].senderId, URLUploadedFile);
                    }
                }
            }
            errMsg = "";
            //set the boolean that a new file got uploaded to false
            newFileUploaded = false;
            sourceFile.newFileUploaded = false;
        }
    });
    //Save Message to DB
    db.testMessages.save(message, function (err, testMessage) {
        if (err) {
            res.send(err);
        }
        res.json(testMessage);
    });
});

//Get W-Lan-landingpage
router.get('/wlanlandingpage', function(req, res, next) {
    res.render('wlanlandingpage', { title: 'Jetzt buchen', errMsg: errMsg, noError: !errMsg});
    console.log("wlanlandingpage ejs rendered");
});

module.exports = router;