var async = require("async");
//var url = require("url");
//var querystring = require('querystring');
//var request = require("request");
//var xml2js  = require('xml2js');
//var moment = require('moment');
var isDBREADY = false;

if (process.env.NODE_ENV === 'production') { var config = require('./config'); }
else { var config = require('./config-dev'); }

var passport = require('passport');
var Strategy = require('passport-http-bearer').Strategy;

passport.use(new Strategy(
  function(token, cb) {
      if (token === config.token) {
           console.log("token ok");
          return cb(null, 'OK!');
      }
       console.log("token not ok");
      return cb('Incorrect token!');
}));

//var parser = new xml2js.Parser();
var express  = require('express');
var https = require( "https" );  // для организации https
var fs = require( "fs" );
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.json());

var httpsOptions = {
    key: fs.readFileSync("key.pem"), // путь к ключу
    cert: fs.readFileSync("cert.pem") // путь к сертификату
};

// var form =  {
//     userName: config.sms_username,
//     password: config.sms_password,
//     isFlash: 'false',
//     lifeTime: '1',
//     destNumber: '',
//     senderAddr: config.sms_sender,
//     text: ''
// };

var mongoose = require('mongoose');

// MONGODB
var historySchema = new mongoose.Schema({
		id_doc: { type: String, index: true },		
		//isSent: Boolean,
        //isOK: Boolean,
        moment: Date,
        createdAt: { type: Date, index: true },
        date: { type: Date, index: true}
	}, { strict: false });

var HISTORY = mongoose.model('reception_histories', historySchema);
var HISTORY_pharmacy = mongoose.model('pharmacy_reception_histories', historySchema);

mongoose.Promise = global.Promise;
mongoose.connect(config.MONGO_URL, function(err) {
    //console.log('Connection string: '+config.MONGO_URL); // for debugging only
    if (err) {
        console.log(err);
    } else {
        console.log('Start - ' + Date());
        console.log('Connected to MongoDB (from start)!');
    }
});

// If the connection throws an error
mongoose.connection.on("error", function(err) {
  console.error('Failed to connect to DB on startup ', err);
  isDBREADY = false;
});

// When the connection is disconnected
mongoose.connection.on('disconnected', function () {
  console.log('Mongoose default connection to DB disconnected');
  isDBREADY = false;
});

mongoose.connection.on("connected", function(ref) {
  console.log("Connected to DB!");
  isDBREADY = true;
});

//GET method route
// app.get('/test', passport.authenticate('bearer', { session: false }), function(req, res) {
//     res.send({result: 'Everithing ok :)'});
// });

// POST method route
app.post('/reception_docs', passport.authenticate('bearer', { session: false }), function (req, res) {

    // chek DB status
    if (!isDBREADY) {
        res.status(400).send('DB is not ready!');
    }

    var data_from1C = req.body;
    console.log('data from 1C:');
    console.log(data_from1C);

    // check 'array' field existence
    if (data_from1C.id_doc === undefined) {
        console.log('Can not detect id doc in the body of POST-request');
        res.status(400).send('Can not detect id doc in the body of POST-request');
    }

    // write data in DB
    //async.each(data_from1C.array, function(data, callback) {

        console.log('Date ' + new Date());
        console.log('Processing item: ' + JSON.stringify(data_from1C, {indent: true}));

        var new_item = new HISTORY(data_from1C);
        new_item.createdAt = new Date();        
        new_item.id_doc = data_from1C.id_doc;
        // new_item.isOK = false;
        // new_item.answer = '';

        // new_item.save().then((doc) => {
        //     console.log('All changes processed successfully');
        //     res.status(200).send(doc);
        // }, (e) => {
        //     console.log('Error save changes in database: ' + e);
        //     res.status(400).send(e);
        // });


        new_item.save(function(err) {
            if (err) {
                console.log('Error save changes in database: ' + err);
                res.status(500).send(err);
                //callback(err);
            }
            else {
                //console.log('Changes processed');
                console.log('All changes processed successfully');
                res.status(200).send('OK');
                //callback();
            }
        }); // end save to MongoDB

    // }, function(err) {
    //     if( err ) {
    //         console.log(err);
    //         res.status(500).send(err);
    //     } else {
    //         console.log('All changes processed successfully');
    //         res.status(200).send('OK');
    //     }
    // });
});

app.post('/pharmacy_reception_docs', passport.authenticate('bearer', { session: false }), function (req, res) {

    // chek DB status
    if (!isDBREADY) {
        res.status(400).send('DB is not ready!');
    }

    var data_from1C = req.body;
    console.log('data from 1C:');
    console.log(data_from1C);

    // check 'id_doc' field existence
    if (data_from1C.id_doc === undefined) {
        console.log('Can not detect id doc in the body of POST-request');
        res.status(400).send('Can not detect id doc in the body of POST-request');
    }

    // write data in DB
    //async.each(data_from1C.array, function(data, callback) {

        console.log('Date ' + new Date());
        console.log('Processing item: ' + JSON.stringify(data_from1C, {indent: true}));

        var new_item = new HISTORY_pharmacy(data_from1C);
        new_item.createdAt = new Date();        
        new_item.id_doc = data_from1C.id_doc;
        new_item.date   = new Date(data_from1C.date);
        new_item.moment = new Date(data_from1C.moment);        

        new_item.save(function(err) {
            if (err) {
                console.log('Error save changes in database: ' + err);
                res.status(500).send(err);
                //callback(err);
            }
            else {
                //console.log('Changes processed');
                console.log('All changes processed successfully');
                res.status(200).send('OK');
                //callback();
            }
        }); // end save to MongoDB
});

app.post('/get_pharmacy_reception_docs', passport.authenticate('bearer', { session: false }), function(req, res) {
    
    // chek DB status
    if (!isDBREADY) {
        res.status(400).send('DB is not ready!');
    };

    var data_from1C = req.body;
    console.log('data from 1C:');
    console.log(data_from1C); 

    // check 'params' field existence
    if (data_from1C.params === undefined) {
        console.log('Can not detect parametrs in the body of POST-request');
        res.status(400).send('Can not detect parameters in the body of POST-request');
    }; 

    
     var    commercialObject = data_from1C.params.commercialObject,
            documentType = data_from1C.params.documentType;    

    
    if (data_from1C.params.date_begin === undefined || data_from1C.params.date_end === undefined) {
        res.status(400).send('Invalid parameters: Date begin or Date end');
    } else {
        var dateStart = new Date(data_from1C.params.date_begin),
            dateEnd = new Date(data_from1C.params.date_end);

        console.log(dateStart, dateEnd, commercialObject);
        FindPharmacyDocs(commercialObject, documentType, dateStart, dateEnd, res);
    };
});


https.createServer(httpsOptions, app).listen(config.port, function() {
    console.log('Server listening on port %d in %s mode', config.port, process.env.NODE_ENV);
});

function FindPharmacyDocs(commercialObject, documentType, startDate, endDate, res){
    
    if (commercialObject === 'pharmacy' && documentType === 'reception')  {  
    
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write('');
    //получаем записи в базе данных за указанный период - сворачиваем по уникальному идентификатору документа (т.к. есть несколько версий объекта)
        HISTORY_pharmacy.find({date: {$gte: startDate, $lt:endDate}}).distinct('id_doc').exec(function (err, finded_ides){ 
            var firstItem = true;            
            async.eachSeries(finded_ides, function(id_doc, callback) {
                console.log('doc - ' + id_doc); //only debug
            //из множества версий каждого документа - выбираем последний по дате
                HISTORY_pharmacy.findOne({id_doc: id_doc}).sort({moment: 'desc'}).exec(function (err, finded_docs){
                    // async.eachSeries(finded_docs, function(doc, callback) {
                        console.log('doc - ' + finded_docs.id_doc, finded_docs.moment); //only debug
                        res.write(firstItem ? (firstItem=false,'[') : ',');
                        res.write(JSON.stringify({ item_doc: finded_docs }));
                        callback();
                    // });                    
                });                
            }, function(err) {
                // if any of the file processing produced an error, err would equal that error
                if(err) {
                    // One of the iterations produced an error.
                    // All processing will now stop.
                    console.log('Error: ');
                    console.log(err);
                    res.status(400).send('Error in processing');
                } else {
                    console.log('All docs processed successfully');
                    res.end(']');
                }                
            });
        });
    } else {
        res.status(400).send('Unknown parameters');
    }
}