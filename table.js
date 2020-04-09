
//Tell the library which element to use for the table
cards.init({table:'#card-table'});

//Create a new deck of cards
deck = new cards.Deck({faceUp:false}); 
//By default it's in the middle of the container, put it slightly to the side
deck.x = 50;
deck.y = 50;

//No animation here, just get the deck onto the table.
deck.render({immediate:true});

let numPlayers = 4;
let playerHands = [];
let playerPlayPile = [];
let isMyTurn = false;

//Now lets create a couple of hands, one face down, one face up.
playerHands[0] = new cards.Hand({faceUp:false, y:50});
playerHands[1] = new cards.Hand({faceUp:false, x: 550, y:200});
playerHands[2] = new cards.Hand({faceUp:false, y:350});
playerHands[3] = new cards.Hand({faceUp:false, x: 50, y:200});
kittyHand = new cards.Hand({faceUp:false, x: 550, y:50});

//Lets add a discard pile
playerPlayPile[0] = new cards.Deck({faceUp:true, y:150});
playerPlayPile[1] = new cards.Deck({faceUp:true, x:350});
playerPlayPile[2] = new cards.Deck({faceUp:true, y:250});
playerPlayPile[3] = new cards.Deck({faceUp:true, x:250});

// TODO make these go to their own
tricksPile = new cards.Deck({faceUp:false, x:550, y:350});
discardPileShared = false;

// ? for now just have it always be true
function setMyTurn(value) {
  isMyTurn = value;
}

function setSharedDiscardPile() {
  //TODO this should be something else but fine for now
  discardPileShared = true;
}

function setDiscardToMiddle() {
  //Use your own space right in front of you.
  discardPileShared = false;
}

function setMyPlayer(playerNum) {
  playerHands[playerNum].faceUp = true;

  playerHands[playerNum].click(function(card){
    if(isMyTurn) {
      playCard(playerNum, card);
    }
  });
}

function setDeck(customDeck) {

  if(customDeck.length != 52) {
    console.log("Error: given deck not the right size: " + customDeck.length);
  }

  var tempDeck = [];
  for (var i = 0; i < customDeck.length; i++) {
    var suit = customDeck[i].charAt(0);
    var mitchRank = customDeck[i].charAt(1);
    var rank = getRank(mitchRank);
    
    tempDeck.push(new cards.Card(suit, rank, '#card-table'));
  }
  
  deck.addCards(tempDeck); 
  
  function mouseEvent(ev) {
    console.log("card clicked");
		var card = $(this).data('card');
		if (card.container) {
			var handler = card.container._click;
			if (handler) {
				handler.func.call(handler.context||window, card, ev);
			}
		}
	}
  
  $('.card').click(mouseEvent);
}

function getRank(character) {
  switch(character) {
    case 'T': return 10;
    case 'J': return 11;
    case 'Q': return 12;
    case 'K': return 13;
    case 'A': return 14;
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
    case '7':
    case '8':
    case '9': return Number(character);
  }
  
  throw "Trying to make deck out of bad card rank: " + character;
}

function getMitchCard(card) {
  return card.suit + getMitchRank(card.rank);
}

function getMitchRank(number) {
  switch(number) {
    case 10: return 'T';
    case 11: return 'J';
    case 12: return 'Q';
    case 13: return 'K';
    case 14: return 'A';
    case 9:
    case 8:
    case 7:
    case 6:
    case 5:
    case 4:
    case 3:
    case 2: return number.toString();
  }
  
  throw "Trying to make mitch deck out of bad card rank: " + number;
}

function deal() {
  $('#deal').hide();
  deck.deal(5, playerHands, 50);
  deck.deal(3, [kittyHand], 50);
}

function fillHandsWithNewCards() {
    for(var i = 0; i < playerHands.length ; i++) {
      var numCards = playerHands[i].length;
      if(numCards < 5) {
        deck.deal(5 - numCards, [playerHands[i]], 50);
      }
    }
}

function addKittyToHand(playerNum) {
  playerHands[playerNum].addCard(kittyHand.topCard());
  playerHands[playerNum].addCard(kittyHand.topCard());
  playerHands[playerNum].addCard(kittyHand.topCard());
  playerHands[playerNum].render();
}

var numPlays = 0;
function playCard(playerNum, card) {
  if(discardPileShared) {
    card.selected = !card.selected;
    playerHands[playerNum].render();
  }
  else {
    //Game play stage
    //TODO make sure not too many cards were played and be smarter about when to collect
    playerPlayPile[playerNum].addCard(card);
    playerPlayPile[playerNum].render();
    playerHands[playerNum].render({speed:1000, callback: function() {
      numPlays += 1;
      if(numPlays == 4) {
        giveTrickTo(0);
        numPlays = 0;
      }
    }});
  }
}

function selectTrump(trump, playerNum) {
  for(var i = 0; i < playerHands[playerNum].length ; i++) {
    var tempCard = playerHands[playerNum][i];
    
    if(tempCard.suit !== trump && !isAceOfHearts(tempCard)) {
      tempCard.selected = true;
    }
  };
  
  playerHands[playerNum].render();
}

function isAceOfHearts(card) {
  return card.suit === 'h' && card.rank == 14;
}

//Returns a list of indices to remove
function getCardsToRemove(playerNum) {
  var indicesToRemove = []
  
  for(var i = 0; i < playerHands[playerNum].length ; i++) {
    var tempCard = playerHands[playerNum][i];
    
    if(tempCard.selected) {
      indicesToRemove.push(i);
    }
  };
  
  var numCardsRemaining = playerHands[playerNum].length - indicesToRemove.length;
  
  return {numCardsRemaining, indicesToRemove};
}

function removeCards(playerNum, indices) {
  //Have to do it backwards bc the hand shrinks as you remove
  for(var i = indices.length - 1; i >= 0; i--) {
    var tempCard = playerHands[playerNum][indices[i]];
    tricksPile.addCard(tempCard);
  };
  
  tricksPile.render();
  playerHands[playerNum].render({speed:1000});
}

function giveTrickTo(playerNum) {
  for(let i = 0; i < numPlayers ; i++) {
    let card = playerPlayPile[i].bottomCard();
    //playerPlayPile[i].remove(card);
    tricksPile.addCard(card)
    tricksPile.render();
  }
}
