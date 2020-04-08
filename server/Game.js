const deck = require("./Deck");

class Game {
  constructor(numPlayers) {
    // Strings
    this.numPlayers = numPlayers;
    this.players = Array(numPlayers).join(".").split("."); //Empty Strings
    this.deck = deck.getNewDeck();
    this.dealerIndex = 1;//Math.floor(Math.random()*numPlayers);
    this.currentTurnIndex = (this.dealerIndex + 1) % numPlayers;
    // "bid", "pickSuit", "throwAway", "makeBid"
    this.state = "setup";
    this.waitingForAnimation = false;
    this.playersPresent = new Set();
    this.currentBid = 0;
  }

  getCurrentTurnIndex() {
    return this.currentTurnIndex;
  }

  getState() {
    return this.state;
  }

  startGame() {
    //TODO
    return this.state = "bid"
  }

  hasPlayerAlready(player) {
    return this.playersPresent.has(player);
  }

  addPlayerToRoom(player) {
    this.playersPresent.add(player);
  }

  removePlayerFromFroom(player) {
    this.playersPresent.delete(player);
  }

  seatOpen(seatNum) {
    if(this.players[Number(seatNum)]) {
      return false;
    }

    return true;
  }

  getNumPlayersSeated() {
    var count = 0;

    for(var i = 0 ; i < this.players.length ; i++) {
      if(!this.seatOpen(i)) {
        count += 1;
      }
    }

    return count;
  }

  addPlayer(player, seatNum) {
    console.log("Adding player " + player + " to seat " + seatNum);
    if(this.state != "setup") {
      throw "Can't add player. Not in setup. Currently in: " + this.state;
    }

    if(!this.seatOpen(seatNum)) {
      throw "Can't add player: " + player + " to seat " + seatNum + ". Already taken by: " + this.players[seatNum];
    }

    for(var i = 0 ; i < this.players.length ; i++) {
      if(player == this.players[i]) {
        throw "Can't add player: " + player + " to seat " + seatNum + ". Already taken in seat: " + i;
      }
    }

    console.log("Adding player " +   this.players[seatNum] + " to seat " + seatNum);
    this.players[seatNum] = player;
  }

  newHand() {
    this.deck = deck.getNewDeck();
    this.dealerIndex = this.getNextIndex(this.dealerIndex);
    this.currentTurnIndex = this.getNextIndex(this.currentTurnIndex);
    this.currentBid = 0;
    this.currentTrump = "unchosen";
  }

  getDeck() {
    return this.deck;
  }

  isTurn(player) {
    return player == this.players[this.currentTurnIndex];
  }

  getBidOptions() {
    switch(this.currentBid) {
      case 0: return ["Pass", "15", "20", "25", "30"];
      case 15: return ["Pass", "20", "25", "30"];
      case 20: return ["Pass", "25", "30"];
      case 25: return ["Pass", "30"];
      case 30: return ["15"];
    }

    throw "Invalid current bid: " + this.currentBid;
  }

  makeBid(name, seat, bid) {
    //TODO make sure right player
    console.log("Making bid")
    var options = this.getBidOptions();
    console.log("options: " + options + " bid: " + bid);

    if(options.includes(bid)) {
      if(bid != "Pass") {
        this.currentBid = Number(bid);
        this.bidderIndex = this.currentTurnIndex;
      }

      if(this.dealerIndex == this.currentTurnIndex) {
        this.state = "pickSuit";
      }
      else {
        this.currentTurnIndex = this.getNextIndex(this.currentTurnIndex);
      }
    }
  }

  getNextIndex(currentIndex) {
    return (currentIndex + 1) % this.players.length;
  }

  passBid() {
    if(this.dealerIndex == this.currentTurnIndex) {
      if(this.currentBid == 0) {
        console.log("Dealer got bagged");
        this.bidderIndex = this.dealerIndex;
      }

      this.state = "pickSuit";
    }
    else {
      this.currentTurnIndex = getNextIndex(this.currentTurnIndex);
    }
  }

  pickSuit(player, suit) {
    if(player != this.players[this.bidderIndex]) {
      throw "Player " + player + " can't make bid. It's " + this.players[this.bidderIndex] + "'s bid...";
    }

    this.trump = suit;
    this.state = "throwAway";
  }



}

module.exports = Game;
