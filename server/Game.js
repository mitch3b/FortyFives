const deck = require("./Deck");

class Game {
  constructor(numPlayers) {
    // Strings
    this.numPlayers = numPlayers;
    this.players = Array(numPlayers).join(".").split("."); //Empty Strings
    this.deck = deck.getNewDeck(); 
    this.dealerIndex = Math.floor(Math.random()*numPlayers);
    this.currentTurnIndex = (this.dealerIndex + 1) % numPlayers;
    // "bid", "pickSuit", "throwAway", "makeBid"
    this.state = "setup";
    this.waitingForAnimation = false;
    this.playersPresent = new Set();
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
    return this.players[Number(seatNum)] == "";
  }
  
  getNumPlayersSeated() {
    var count = 0;
    
    for(var i = 0 ; i < this.players.length ; i++) {
      if(!this.seatOpen(this.players[i])) {
        count += count;
      }
    }
    
    return count;
  }
  
  addPlayer(player, seatNum) {
    if(this.state != "setup") {
      throw "Can't add player. Not in setup. Currently in: " + this.state;
    }
    
    if(!this.seatOpen(seatNum)) {
      throw "Can't add player: " + this.player + " to seat " + this.seatNum + ". Already taken by: " + this.players[seatNum];
    }
    
    this.players[seatNum] = player;
  }

  newHand() {
    this.deck = new cards.Deck(); 
    this.deck.addCards(cards.all); 
  }

  getDeck() {
    return this.deck;
  }
  
  isTurn(player) {
    return player == this.players[this.currentTurnIndex];
  }
  
  getBidOptions() {
    switch(this.currentBid) {
      case 0: return [15, 20, 25, 30];
      case 15: return [20, 25, 30];
      case 20: return [25, 30];
      case 25: return [30];
      case 30: return [];
    }
    
    throw "Invalid current bid: " + this.currentBid;
  }
  
  makeBid(bid) {
    var options = getBidOptions();
    
    if(bid in options) {
      this.currentBid = bid;
      this.bidderIndex = this.currentTurnIndex;
      
      if(this.dealerIndex == this.currentTurnIndex) {
        this.state = "pickSuit";
      }
      else {
        this.currentTurnIndex = getNextIndex(this.currentTurnIndex);
      }
    }
    
    throw "Bid " + bid + " is invalid. Current bid is: " + this.currentBid;
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
