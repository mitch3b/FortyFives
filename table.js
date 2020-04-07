
//Tell the library which element to use for the table
cards.init({table:'#card-table'});

//Create a new deck of cards
deck = new cards.Deck(); 
//By default it's in the middle of the container, put it slightly to the side
deck.x = 50;
deck.y = 50;

//cards.all contains all cards, put them all in the deck
deck.addCards(cards.all); 
//No animation here, just get the deck onto the table.
deck.render({immediate:true});

let numPlayers = 4;
let playerHands = [];
let playerPlayPile = [];

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
tricksPile = new cards.Deck({faceUp:true, x:550, y:350});


//Let's deal when the Deal button is pressed:
$('#deal').click(function() {
	//Deck has a built in method to deal to hands.
	$('#deal').hide();
	deck.deal(5, playerHands, 50);
  deck.deal(3, [kittyHand], 50);
});


for(let i = 0; i < numPlayers ; i++) {
  playerHands[i].click(function(card){
    // if (allowed)
    playCard(i, card);
  });
}

var numPlays = 0;
function playCard(playerNum, card) {
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

function giveTrickTo(playerNum) {
  for(let i = 0; i < numPlayers ; i++) {
    let card = playerPlayPile[i].bottomCard();
    //playerPlayPile[i].remove(card);
    tricksPile.addCard(card)
    tricksPile.render();
  }
}
