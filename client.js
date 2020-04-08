(function init() {
  let name;
  let roomId;
  let mySeat;

  const socket = io.connect('http://localhost:5000');

  function displayTable() {
    $('.menu').css('display', 'none');
    $('.gameTable').css('display', 'block');
  }

  function sitPlayer(sittingPlayerName, seatNum) {
    console.log("Player sat: " + sittingPlayerName + "in seat: " + seatNum);
    //For now just reuse the button as name field
    $('#seatLabel' + seatNum).html(sittingPlayerName);

    if(sittingPlayerName == name) {
      mySeat = seatNum;

      //Hide all
      $('[id^="sitButton"]').css("display", "none");
      $('#sitButton' + seatNum).css("display", "inline-block");
      $('#sitButton' + seatNum).html("Leave Seat");
    }
    else {
      // Hide the sat seated in
      $('#sitButton' + seatNum).css("display", "none");
    }
  }

  // #################################
  // Server interaction
  // #################################
  // $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
  // Create/Enter Game
  // $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
  $('#new').on('click', () => {
    const newName = $('#nameNew').val();
    if (!newName) {
      alert('Please enter your name.');
      return;
    }
    socket.emit('createGame', { name: newName});
    name = newName;
  });

  socket.on('gameCreated', (data) => {
    roomId = data.roomId;

    displayTable();
  });

  $('#join').on('click', () => {
    const name = $('#nameJoin').val();
    const roomId = $('#room').val();
    if (!name || !roomId) {
      alert('Please enter your name and game ID.');
      return;
    }
    socket.emit('attemptToJoinGame', { name, roomId: roomId });
  });

  socket.on('InitForJoiningPlayer', (data) => {
    console.log("Joined " + data.roomId + " as player: " + data.name);
    roomId = data.roomId;
    name = data.name;
    displayTable();

    game = JSON.parse(data.game);
    for(var i = 0 ; i < game.players.length ; i++) {
      if(game.players[i] != "") {
        sitPlayer(game.players[i], i);
      }
    }
  });

  // $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
  // Game Setup
  // $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
  $('[id^="sitButton"]').click(function() {
    var seatNum = this.id.replace('sitButton', '');

    if(this.innerHTML === "Sit") {
      socket.emit('tryToSit', { name, roomId: roomId, seatNum: seatNum});
    }
    else {
      alert("TODO: This feature is currently not supported. Sorry!");
    }
  });

  $('[id^="bid"]').click(function() {
    var bid = this.id.replace('bid', '');
    console.log("Bidding " + bid);

    socket.emit('bid', { name, roomId: roomId, seatNum: mySeat, bid: bid});
  });

  socket.on('playerSat', (data) => {
    console.log("Server said to sit player " + data.name + " in seat " + data.seatNum + ". Total seats filled: " + data.numSeatsFilled);

    sitPlayer(data.name, data.seatNum);

    //TODO put this back in once done testing
    //if(data.numSeatsFilled == $('[id^="sitButton"]').length) {
      $('#start').css("display", "block");
    //}
  });

  $('#start').on('click', () => {
    socket.emit('startGame', { name, roomId: roomId });
  });

  socket.on('gameStart', (data) => {
    console.log("Server said that " + data.name + " started the game");

    $('#start').css("display", "none");
    $('[id^="sitButton"]').css("display", "none");

    setMyPlayer(mySeat);
  });

  socket.on('startBidding', (data) => {
    console.log("Server said to start bidding.");

    game = JSON.parse(data.game);
    setDeck(game.deck);
    deal();

    console.log("First to act is player in seat: " + game.currentTurnIndex);

    setBidOptions(game.currentTurnIndex, data.biddingOptions);
  });

  socket.on('nextBid', (data) => {
    console.log("Server said : " + data.bidder + " bid: " + data.bid);
    console.log("Next player to act is in seat: " + data.currentTurnIndex);

    //TODO show some sort of who has the bid
    setBidOptions(data.currentTurnIndex, data.biddingOptions);
  });

  socket.on('biddingComplete', (data) => {
    console.log("Server said : " + data.bidder + " won the bid with: " + data.bid);

    hideBidOptions();
  });

  function hideBidOptions() {
    $('#divBidOptions').css("display", "none");
  }

  function setBidOptions(currentTurnIndex, biddingOptions) {
    if(currentTurnIndex == mySeat) {
      $('#divBidOptions').css("display", "inline");

      $('[id^="bid"]').map(function() {
        var bidAmount = this.id.replace('bid', '');

        if(bidAmount === undefined) {
          console.log("undefined");
        }

        this.disabled = !biddingOptions.includes(bidAmount);
      });
    }
    else {
      hideBidOptions();
    }
  }

  socket.on('alert', (data) => {
    console.log("Received alert from server: " + data.message);
    alert(data.message);
  });
 }());
