// requires

var express = require("express");
var mongoose = require("mongoose");


var bodyparser = require("body-parser");
var url = require('url');
var gcm = require('node-gcm');
var cors = require('cors');
// initiate express
var app  = express();
//configure application




app.configure(function(){
 app.use(cors());
 app.use(bodyparser.json());
 app.use(bodyparser.urlencoded({extended:true}));
 app.set('port',process.env.PORT);

});
var http = require("http").Server(app);

 
var io = require('socket.io').listen(http);




http.listen(process.env.PORT);


//configure mongoose
mongoose.connect('mongodb://127.0.0.1:27017');
var db = mongoose.connection;

db.on('error',function(){
 console.log('connection error');
});
db.once('open',function(callback){
 console.log('connected');
});


//create database schema
var locSchema = mongoose.Schema({
  type: {type:String},
  geometry:{
   type : {type : String}, 
   coordinates : {type : [Number]}
  },
  properties:{
   user: String,
   id: Number,
  }
 });

var userSchema = mongoose.Schema({
 user: String,
 id : Number,
 type : Number,
 terminal: Number,
 name: String,
 details:[String],
 device: String,
 registration_id: String,
 instance_id: String,
 token_id: String
});

//locSchema.index({coordinates : "2dsphere"});

// Create database and models
var Loca = mongoose.model('Loca', locSchema);
var User = mongoose.model('User', userSchema);

//startup script
var _id = 0;
User.find({},{id:1}).sort({id:-1}).limit(1).exec(function(err,doc){
  if(err){
   console.log(err);
  }
  else{
   console.log(doc);
   try{
   _id = doc[0].id;
   }
   catch(e){
    _id = 0;
   }
   
  }
  
 });



// route the requests
app.get('/',getHomePage);

app.get('/users',getAllUsers);

app.get('/users/q',getQUsers);

app.get('/pari', hiPari);

app.get('/locs',getAllLocs);

app.get('/locs/q',getQLocs);

app.get('/questions/p', getPQuestions);

app.get('/chatrooms',getChatrooms);


app.post('/', postHomePage);

app.post('/users',postAllUsers);

app.post('/users/q',postQUsers);

app.post('/locs',postAllLocs);

app.post('/locs/q',postQLocs);

app.post('/locs/r', postRLocs);







//----------------------------------------------------------------------------

function getChatrooms(req,res) {
 console.log('getChatrooms');
 console.log(process.env.PORT);
 console.log(process.env.IP);
 res.sendfile(__dirname + '/public/chatroom.html');
}



//-----------------------------------------------------------------------------

function getHomePage(req,res){
 console.log('getHomePage');
 res.status(200).sendfile(__dirname+ '/public/home.html');

}



//-----------------------------------------------------------------------------
function getAllUsers(req,res){
 // register user page
 
 console.log('getAllUsers');
res.status(200).sendfile(__dirname+ '/public/register.html') ;
 

}

//-----------------------------------------------------------------------------
function getQUsers(req,res){
 console.log('getQUsers');
var url_parts = url.parse(req.url, true);
var mname = url_parts.query;

 console.log(mname);

 res.end();
}


//-----------------------------------------------------------------------------
function hiPari(req, res){
 console.log('pari');
 res.end('<html><head></head><body>Hi pari</body></html>');
}


//-----------------------------------------------------------------------------
function getAllLocs(req,res){
 console.log('getAllLocs');
Loca.find(function(err,locsa){
  //console.log(locsa);
  if(err)
  res.status(500).end();
  else
  res.status(200).json(locsa).end();
 });
 
}


//-----------------------------------------------------------------------------
function getQLocs(req,res){
 console.log('getQLocs');
  
 var url_parts = url.parse(req.url, true);
 var url_p = url_parts.query;
 var qx = url_p.x;
 var qy = url_p.y;
 var maxd = Number(url_p.d);
 var mesg = url_p.m;
 var usr = url_p.usr;
 var token_id = url_p.token_id;
 
 console.log(mesg);
 

 if(qx == undefined || qy == undefined || maxd == undefined || mesg == undefined || usr == undefined || token_id == undefined){
  res.status(500).end('woops');
  
 }
 else{
  
  
 Loca.find({geometry: {$near : {$geometry: {type : "Point", coordinates: [qx,qy]},$minDistance:0,$maxDistance:maxd}}},function(err, locsn) {
    
    if(err){
    console.log(err);
    res.status(500).json(err);
    }
    else{
    //res.status(200).json(locsn);
    
    var keys = new Array();
    var noPoints = locsn.length;
    console.log(noPoints);
    var ids = new Array();
    for(var idx in locsn){
     var point = locsn[idx];
     console.log(point.properties.id)
     ids.push(point.properties.id);
     
    }
    
    User.find({id:{$in : ids} },function(err, doc) {
      if(err)
       console.log(err);
      else{
       for(var idx in doc){
        keys.push(doc[idx].registration_id);
       }
       console.log(keys);
       var msg = new gcm.Message();
       
       msg.addData('user', usr);
       msg.addData('mesg', mesg);
       msg.addData('token_id',token_id);
       
       var sender = new gcm.Sender('AIzaSyCeJYJkcZXgdyb0vUZXO3_uS8OG8AoEjAc');
       console.log(msg);
       sender.send(msg,keys,function(err,res){
        if(err)
         console.log(err);
        else
         console.log(res);
       });

      }
     });
    
     
    
    
    }
     
    
 });
 
 var resID = encodeURIComponent(mesg);
 res.redirect('/chatrooms?id=' + resID);
 // res.end();
  
 }
 
 
}


//-----------------------------------------------------------------------------

function getPQuestions(req,res){
 
 
 console.log('getPQuestions');
res.status(200).sendfile(__dirname+ '/public/question.html') ;
 

 
}



//-----------------------------------------------------------------------------
function postHomePage(req,res){
 
 console.log('postHomePage');
 
}


//-----------------------------------------------------------------------------
function postAllUsers(req,res){
 console.log('postAllUsers');
 
 console.log(req.body);
 
 var _user = req.body.user;
 
 var _type = req.body.type;
 var _terminal = req.body.terminal;
 var _name = req.body.name;
 var _details = req.body.details;
 var _device = req.body.device;
 var _registration_id = req.body.registration_id;
 var _instance_id = req.body.instance_id;
 var _token_id = req.body.token_id;
  _id = _id + 1;
 
 console.log(_id);
 
 if(_user == undefined || _id == undefined || _type == undefined || _name == undefined || _details == undefined || _device == undefined || _registration_id == undefined || _instance_id == undefined || _token_id == undefined){
  
  res.status(500).end('woops');
 }
 else{
 
 var user = new User({
   user: _user,
 id : _id,
 type : _type,
 terminal: _terminal,
 name: _name,
 details:_details,
 device: _device,
 registration_id: _registration_id,
 instance_id: _instance_id,
 token_id: _token_id
 });
 


 user.save(function(err){
 if(err)
  console.log(err);
 else
  console.log('User created with id : '+user.id);
});
 var userId = String(user.id);
 res.write(userId);
 res.end();
 }
 
}


//-----------------------------------------------------------------------------
function postQUsers(req,res){

console.log('postQUsers');

 
}


//-----------------------------------------------------------------------------
function postAllLocs(req, res){
 console.log('postAllLocs');
}


//-----------------------------------------------------------------------------
function postQLocs(req,res){
 console.log('postQLocs');
 var _lat = req.body.lat;
 var _lng = req.body.lng;
 var _geometry_coordinates = [_lat,_lng];
 var _user = req.body.user;
 var _id = req.body.id;
 console.log('requset'+_id);
 if(_lat == undefined || _lng == undefined || _user == undefined || _id == undefined){
  console.log('undefined'+_id);
  res.status(500).end();
 }
 else{
 
 User.find().where({id: _id}).exec(function(err,doc){
  if(_user == doc[0].user){
   console.log('user found'+_id);
  }
  else
  {
   _user = doc[0].user;
  console.log('user not found'+_id);
  }
 var updateData = {
  type: "Feature",
  geometry:{
   type : "Point",
   coordinates : _geometry_coordinates
  },
  properties:{
   user: _user,
   id: _id,
  }
 }
 
 Loca.findOneAndUpdate({id: _id}, updateData,{upsert:true},function(err,doc){
  if(err)
   console.log(err);
  else
   console.log(doc);
  });
 }); 
 
 
 res.redirect('/');
 
 }
}


//-----------------------------------------------------------------------------
function postRLocs(req, res){
 // handle the post request 
 
 
}

//==============================================================================
//==============================================================================

//Primitives

String.prototype.hashCode = function() {
  var hash = 0, i, chr, len;
  if (this.length == 0) return hash;
  for (i = 0, len = this.length; i < len; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};


//==============================================================================
//==============================================================================
//===========================CHAT FUNCTIONALITY=================================
//==============================================================================
//==============================================================================
//==============================================================================



var rooms = [];

io.on('connection', function(socket){
 console.log(io.url);
  console.log('connection called from client' + socket);
  socket.on('chat message', function(msg){
    io.sockets.emit('update chat',msg);
    console.log('message: ' + msg);
  });
  socket.on('question',function(data){
   // create a question id
   var c_id = data.question;
   var socket_id = socket.id;
   socket.question = c_id;
   console.log(socket_id);
   var room = {
     id:c_id,
     sockets: [],
     messages : []
   }
   room.sockets.push(socket_id);
   rooms.push(room);
   console.log(rooms.length);
   console.log(rooms[0].sockets.length);
   console.log(c_id);
   io.to(socket_id).emit('new question',c_id);
  });
  
  socket.on('responded',function(data){
   var r_id = data.id;
   for(var iter = 0; iter < rooms.length; iter++){
    if(rooms[iter].id == r_id){
     rooms[iter].sockets.push(socket.id);
     for (var itr = 0; itr < rooms[iter].messages.length; itr++){
      io.to(socket.id).emit('new message',rooms[iter].messages[itr]);
     }
    }
   }
  });
  
  socket.on('answer',function(message){
   var m_id = message.id;
   
   //================================================================
   // Figure out a way to not iterate but also to not destroy memory
   //===============================================================
   console.log('answer called');
   console.log(m_id);
   for(var iter = 0; iter < rooms.length; iter++){
    var myroom = rooms[iter];
    var s_id = myroom.id;
    
    console.log(m_id +' == '+ s_id);
    if(m_id == s_id){
     console.log('matched');
     rooms[iter].messages.push(message);
     var thisroom = myroom;
     var mysockets = thisroom.sockets;
     console.log(mysockets);
     for(var idx = 0; idx < mysockets.length; idx++){
      var thissocket = mysockets[idx];
      
      console.log(thissocket);
      io.to(thissocket).emit('new message', message);
     }
    }
   }
  });
  
  socket.on('disconnect',function(){
   // Figure out how to delete a room and it's messages from memory once all the clients are disconnected
   
   var d_id = socket.id;
   console.log(d_id+" disconnected " + socket.question);
   
   
  });
  
  io.sockets.emit('connection-emit');
  console.log('connection-emit');
  
  
  
  
});
