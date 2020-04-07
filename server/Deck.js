const suits = ['c', 'd', 'h', 's'];
const vals = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const unshuffledDeck = [];
suits.forEach(function(a1){
  vals.forEach(function(a2){
    unshuffledDeck.push(a1 + a2);
  });
});

function getNewDeck() {
  var deckClone = [...unshuffledDeck];
  shuffleArray(deckClone);
  return deckClone;
}

//https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array?page=1&tab=votes#tab-top
/* Randomize array in-place using Durstenfeld shuffle algorithm */
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}


exports.getNewDeck = getNewDeck;