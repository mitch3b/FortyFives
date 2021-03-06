const express = require('express');
const path = require('path');

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const Game = require("./server/Game");

let rooms = 0;
let games = new Map();

app.use(express.static('.'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

function isAlphaNumeric(str) {
  var code, i, len;

  for (i = 0, len = str.length; i < len; i++) {
    code = str.charCodeAt(i);
    if (!(code > 47 && code < 58) && // numeric (0-9)
        !(code > 64 && code < 91) && // upper alpha (A-Z)
        !(code > 96 && code < 123)) { // lower alpha (a-z)
      return false;
    }
  }
  return true;
};

io.on('connection', (socket) => {
    //Scope of just the current user
    var connectedUserId;
    var connectedUserRoomId;
    var connectedUserSeatNum;

    // #################################
    // Create a new game room and notify the creator of game.
     // #################################
    socket.on('createGame', (data) => {
      if(!isAlphaNumeric(data.name)) {
        console.log("Can't create game with invalid username: " + data.name);
        socket.emit('alert', { message: 'Username must be only letters and numbers' });
        return;
      }

      var game = new Game(4);
      game.addPlayerToRoom(data.name);
      connectedUserId = data.name;

      var roomName = `room-${++rooms}`
      connectedUserRoomId = roomName;
      socket.join(roomName);
      socket.emit('gameCreated', { name: data.name, roomId: roomName});
      games.set(roomName,  game);
      console.log("Added Game: " + roomName + " with admin " + data.name);
      console.log("Currently " + games.size + " games happening...");
    });

    socket.on('restartGame', (data) => {
      var game = games.get(data.roomId);


      io.in(data.roomId).emit("InitForJoiningPlayer", { name: data.name, roomId: data.roomId, game: JSON.stringify(game, Set_toJSON)})
      games.set(data.roomId,  game);
      console.log("Restarting Game: " + data.roomId + " requested by " + data.name);
    });

    // #################################
    // Join a game.
    // #################################
    socket.on('attemptToJoinGame', function (data) {
      console.log("Adding Player: " + data.name + " to game " + data.roomId);

      if(!isAlphaNumeric(data.name)) {
        console.log("Can't create game with invalid username: " + data.name);
        socket.emit('alert', { message: 'Username must be only letters and numbers' });
        return;
      }

      var room = io.nsps['/'].adapter.rooms[data.roomId];
      if (!room) {
        console.log("Failed to Added Player: " + data.name + ". Room does not exist in io...");
        socket.emit('alert', { message: 'Game ID does not exist in...' });
        return;
      }

      if(!games.has(data.roomId)) {
        console.log("Failed to Added Player: " + data.name + ". Game ID does not exist in games tracker...");
        socket.emit('alert', { message: 'Game ID does not exist...' });
        return;
      }

      var game = games.get(data.roomId);

      if(game.hasPlayerAlready(data.name)) {
        console.log("Failed to Added Player: " + data.name + ". Name Already taken...");
        socket.emit('alert', { message: 'Name already taken...' });
        return;
      }

      connectedUserRoomId = data.roomId;
      game.addPlayerToRoom(data.name);
      connectedUserId = data.name;
      socket.join(data.roomId);
      socket.broadcast.to(data.roomId).emit('playerJoined', {
        name: data.name,
        seat: data.seat
      });

      //TODO all the game info
      //Setup the player joining
      socket.emit("InitForJoiningPlayer", { name: data.name, roomId: data.roomId, game: JSON.stringify(game, Set_toJSON)})

      console.log("Successfully Added Player: " + data.name + " to game " + data.roomId);
      console.log("Currently " + game.getNumPlayersSeated() + " players seated in game: " + data.roomId);
    });

    function Set_toJSON(key, value) {
      if (typeof value === 'object' && value instanceof Set) {
        return [...value];
      }
      return value;
    }

    socket.on('tryToSit', (data) => {
      console.log("Player: " + data.name + " trying to sit in seat: " + data.seatNum + " of room: " + data.roomId);

      try {

        //TODO something with game state
        var game = games.get(data.roomId);
        if(!game.seatOpen(data.seatNum)) {
          console.log("Player: " + data.name + " cannot sit in taken seat: " + data.seatNum + " of room: " + data.roomId);
          socket.emit('alert', { message: 'Seat already taken...' });
          return;
        }
        
        connectedUserSeatNum = data.seatNum;

        game.addPlayer(data.name, data.seatNum);
        data.numSeatsFilled = game.getNumPlayersSeated();

        io.in(data.roomId).emit('playerSat', data);
      } catch(err) {
        handleError("Error adding Player: " + data.name + " to seat: " + data.seatNum + " of room: " + data.roomId + ". Error: " + err);
      }
    });

    socket.on('startGame', (data) => {
      var game = games.get(data.roomId);

      //TODO make sure all seats are taken
      if(game.getState() != "setup") {
        //This could happen if two people clicked start at  the same time
        console.log("WARN: Player " + data.name + " requested to start game " + data.roomId + " which is already in state " + game.getState());
      }

      game.startGame();

      io.in(data.roomId).emit("gameStart", { name: data.name, roomId: data.roomId, game: JSON.stringify(game, Set_toJSON)})

      games.set(data.roomId,  game); //TODO this probably isn't necessary
      console.log("Starting Game: " + data.roomId + " requested by " + data.name);

      newHand(data);
    });

    function newHand(data) {
      var game = games.get(data.roomId);

      //TODO make sure all seats are taken
      if(game.getState() != "bid") {
        //This could happen if two people clicked start at  the same time
        console.log("WARN: Player " + data.name + " requested to start game " + data.roomId + " which is already in state " + game.getState());
      }

      game.newHand();

      io.in(data.roomId).emit("startBidding", { name: data.name, roomId: data.roomId, game: JSON.stringify(game, Set_toJSON), biddingOptions: game.getBidOptions()})
    }

    socket.on('bid', (data) => {
      var game = games.get(data.roomId);

      //TODO make sure all seats are taken
      if(game.getState() != "bid") {
        handleError("Can't bid. Current game state is: " + game.getState());
      }

      //Update bid
      game.makeBid(data.name, data.mySeat, data.bid);

      if(game.getState() === "bid") {
        io.in(data.roomId).emit("nextBid", { bidder: data.name, roomId: data.roomId, bid: data.bid,           currentTurnIndex: game.getCurrentTurnIndex(), biddingOptions: game.getBidOptions()});
      }
      else if(game.getState() === "pickSuit"){
        io.in(data.roomId).emit("biddingComplete", { bidder: game.getBidder(), bidderIndex: game.getBidderIndex(), roomId: data.roomId, bid: game.getBid()});
      }
      else {
        handleError("After making bid, state updated to something wrong: " + game.getState());
      }
    });
    
    socket.on('chooseSuit', (data) => {
      console.log("Picking suit: " + data.suit + " in game " + connectedUserRoomId + " by user " + connectedUserId);
      var game = games.get(connectedUserRoomId);

      //TODO make sure all seats are taken
      if(game.getState() != "pickSuit") {
        handleError("Can't pick suit. Current game state is: " + game.getState());
      }
      
      if(game.getBidder() != connectedUserId) {
        handleError(connectedUserId + " should not be bidding. Bidder is: " + game.getBidder());
      }

      //Update bid
      game.pickSuit(connectedUserId, data.suit);

      if(game.getState() === "throwAway") {
        io.in(connectedUserRoomId).emit("pickedSuit", { trump: data.suit, bidder: game.getBidder(), bidderSeat: game.getBidderIndex()});
      }
      else {
        handleError("After picking suit, state updated to something wrong: " + game.getState());
      }
    });
    
    socket.on('throwAwayDone', (data) => {
      var game = games.get(connectedUserRoomId);

      //TODO make sure all seats are taken
      if(game.getState() != "throwAway") {
        handleError("Can't throw away. Current game state is: " + game.getState());
      }
      
      var indicesToRemove = JSON.parse(data.indicesToRemove);
      console.log("Throw away the indices: " + indicesToRemove.toString());

      //Update bid
      game.throwAwayDone(connectedUserSeatNum, indicesToRemove);

      if(game.getState() === "throwAway") {
        io.in(connectedUserRoomId).emit("throwAwayHappened", { name: connectedUserId, seatNum: connectedUserSeatNum, indicesToRemove: indicesToRemove});
      }
      else if(game.getState() === "makeBid"){
        io.in(connectedUserRoomId).emit("throwAwayComplete", { name: connectedUserId, seatNum: connectedUserSeatNum, indicesToRemove: indicesToRemove, currentTurn: game.getCurrentTurnIndex()});
      }
      else {
        handleError("After making throw away, state updated to something wrong: " + game.getState());
      }
    });

    function handleError(errorMessage) {
      console.log(errorMessage);
      socket.emit('alert', { message: errorMessage });
    }

    socket.on('disconnect', function() {
      try {
        var game = games.get(connectedUserRoomId);
        game.removePlayerFromRoom(connectedUserId);

        if(game.getNumPlayers() < 1) {
          console.log("Player " + connectedUserId + " left game " + connectedUserRoomId + ". No players left. Deleting game");

          games.delete(game);
        }
        else {
          io.to(roomId).emit('playerLeft', {
            name: connectedUserId,
          });
        }
      } catch(err) {
        console.log("Issue removing player: " + err.message);
      }
    })

     // #################################
     // In Game Events
     // #################################

});

server.listen(process.env.PORT || 5000);
