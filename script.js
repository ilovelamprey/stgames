// A simple representation of a card deck
const createDeck = () => {
    const suits = ['♥', '♦', '♣', '♠'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck = [];
    for (const suit of suits) {
        for (const rank of ranks) {
            let value = parseInt(rank);
            if (['J', 'Q', 'K'].includes(rank)) value = 10;
            if (rank === 'A') value = 11;
            deck.push({ suit, rank, value });
        }
    }
    // Shuffle the deck
    return deck.sort(() => Math.random() - 0.5);
};

// Global game state variables
let deck = [];
let playerHand = [];
let dealerHand = [];
let gameInProgress = false;

// Function to calculate the score of a hand
const calculateScore = (hand) => {
    let score = hand.reduce((sum, card) => sum + card.value, 0);
    let aces = hand.filter(card => card.rank === 'A').length;
    // Adjust for Aces (if score > 21, count Ace as 1 instead of 11)
    while (score > 21 && aces > 0) {
        score -= 10;
        aces--;
    }
    return score;
};

// Main function to start the game
const startGame = () => {
    if (gameInProgress) return;
    gameInProgress = true;

    // Reset game state and create UI
    deck = createDeck();
    playerHand = [deck.pop(), deck.pop()];
    dealerHand = [deck.pop(), deck.pop()];

    createGameUI();
    updateUI();
};

// Creates and injects the game UI into the page
const createGameUI = () => {
    const gameContainer = document.createElement('div');
    gameContainer.id = 'blackjack-container';
    gameContainer.innerHTML = `
        <div class="blackjack-board">
            <h2>Blackjack</h2>
            <div class="hand-container">
                <p>Dealer's Hand (<span id="dealer-score"></span>)</p>
                <div id="dealer-hand" class="hand"></div>
            </div>
            <div class="hand-container">
                <p>Your Hand (<span id="player-score"></span>)</p>
                <div id="player-hand" class="hand"></div>
            </div>
            <div class="buttons">
                <button id="hit-button">Hit</button>
                <button id="stand-button">Stand</button>
            </div>
        </div>
    `;
    document.body.appendChild(gameContainer);

    // Add event listeners for buttons
    document.getElementById('hit-button').addEventListener('click', playerHit);
    document.getElementById('stand-button').addEventListener('click', playerStand);
};

// Updates the UI with current hands and scores
const updateUI = (revealDealerCard = false) => {
    // Player's hand
    document.getElementById('player-hand').innerHTML = playerHand.map(card => `<div class="card">${card.rank}${card.suit}</div>`).join('');
    document.getElementById('player-score').textContent = calculateScore(playerHand);

    // Dealer's hand
    let dealerScoreText = '';
    if (revealDealerCard) {
        document.getElementById('dealer-hand').innerHTML = dealerHand.map(card => `<div class="card">${card.rank}${card.suit}</div>`).join('');
        dealerScoreText = calculateScore(dealerHand);
    } else {
        document.getElementById('dealer-hand').innerHTML = `<div class="card">${dealerHand[0].rank}${dealerHand[0].suit}</div><div class="card hidden"></div>`;
        dealerScoreText = dealerHand[0].value;
    }
    document.getElementById('dealer-score').textContent = dealerScoreText;
};

// Handles the player choosing to "Hit"
const playerHit = () => {
    playerHand.push(deck.pop());
    updateUI();
    if (calculateScore(playerHand) > 21) {
        endGame('lost by busting');
    }
};

// Handles the player choosing to "Stand"
const playerStand = () => {
    // Dealer's turn
    let dealerScore = calculateScore(dealerHand);
    while (dealerScore < 17) {
        dealerHand.push(deck.pop());
        dealerScore = calculateScore(dealerHand);
    }
    updateUI(true);

    const playerScore = calculateScore(playerHand);
    if (dealerScore > 21 || playerScore > dealerScore) {
        endGame(`won with ${playerScore} vs the dealer's ${dealerScore}`);
    } else if (playerScore < dealerScore) {
        endGame(`lost with ${playerScore} vs the dealer's ${dealerScore}`);
    } else {
        endGame('pushed (tied)');
    }
};

// Ends the game and pushes the result to chat
const endGame = (resultText) => {
    gameInProgress = false;
    const context = SillyTavern.getContext();
    const characterName = context.characters[context.characterId].name;

    // Format the message to be sent
    const message = `*[Plays a game of blackjack with ${characterName}. I ${resultText}.]*`;
    
    // Push the result to the chat input and simulate send
    const textarea = document.getElementById('send_textarea');
    const sendButton = document.getElementById('send_but');
    textarea.value = message;
    textarea.dispatchEvent(new Event('input', { bubbles: true })); // Notify ST that input has changed
    sendButton.click();

    // Clean up the UI
    document.getElementById('blackjack-container').remove();
};

// Register the slash command once SillyTavern is ready
SillyTavern.getContext().eventSource.on(SillyTavern.getContext().event_types.APP_READY, () => {
    const command = {
        name: 'blackjack',
        callback: startGame, // The function to call when the command is used
        helpString: 'Starts a new game of blackjack.',
    };
    SillyTavern.SlashCommandParser.addCommand(command);
});
