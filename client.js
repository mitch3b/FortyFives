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
    
    game = JSON.parse(data.game);
    setMyPlayer(mySeat);
    setDeck(game.deck);
    deal();
    //TODO get the cards, set up the deck, find out who goes first and deal.
  });
  
  socket.on('alert', (data) => {
    alert(data.message);
  });
 }());