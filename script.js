// script.js - Main logic for the Blackjack Game SillyTavern Extension

// This script integrates the Blackjack game directly into SillyTavern's chat.

// --- Game State Variables ---
const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

let deck = [];
let playerHand = [];
let dealerHand = [];
let gameOver = false;
let gameResult = ''; // Stores the final outcome message

// --- Core Game Logic Functions ---

/**
 * Creates a standard 52-card deck.
 * @returns {Array<Object>} An array of card objects.
 */
function createDeck() {
    const newDeck = [];
    for (const suit of suits) {
        for (const rank of ranks) {
            newDeck.push({ rank, suit });
        }
    }
    return newDeck;
}

/**
 * Shuffles the given deck using the Fisher-Yates algorithm.
 * @param {Array<Object>} deck - The deck to shuffle.
 */
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]]; // Swap elements
    }
}

/**
 * Deals a single card from the deck.
 * If the deck is empty, it creates and shuffles a new one.
 * @returns {Object} The dealt card.
 */
function dealCard() {
    if (deck.length === 0) {
        deck = createDeck();
        shuffleDeck(deck);
        console.log("[Blackjack Extension] Deck reshuffled.");
    }
    return deck.pop();
}

/**
 * Calculates the value of a hand, handling Aces (1 or 11).
 * @param {Array<Object>} hand - The hand to calculate the value for.
 * @returns {number} The total value of the hand.
 */
function getHandValue(hand) {
    let value = 0;
    let numAces = 0;

    for (const card of hand) {
        if (card.rank === 'A') {
            numAces++;
            value += 11;
        } else if (['K', 'Q', 'J', '10'].includes(card.rank)) {
            value += 10;
        } else {
            value += parseInt(card.rank);
        }
    }

    // Adjust for Aces if busting
    while (value > 21 && numAces > 0) {
        value -= 10;
        numAces--;
    }
    return value;
}

/**
 * Converts a hand into a readable string format.
 * @param {Array<Object>} hand - The hand to format.
 * @param {boolean} hideSecondDealerCard - If true, hides the second card for the dealer.
 * @returns {string} The formatted hand string.
 */
function formatHand(hand, hideSecondDealerCard = false) {
    if (!hand || hand.length === 0) return "No cards";
    return hand.map((card, index) => {
        if (hideSecondDealerCard && index === 1) {
            return "[Hidden Card]";
        }
        return `${card.rank}${card.suit}`;
    }).join(', ');
}

/**
 * Ends the current game and sets the final result message.
 * @param {string} message - The final outcome message.
 */
function endGame(message) {
    gameOver = true;
    gameResult = message;
    console.log(`[Blackjack Extension] Game Over. Result: ${message}`);
}

// --- Game Flow Functions ---

/**
 * Initializes a new game of Blackjack.
 * Resets hands, shuffles deck, and deals initial cards.
 * @returns {string} An initial game status message.
 */
function initGame() {
    gameOver = false;
    deck = createDeck();
    shuffleDeck(deck);
    playerHand = [];
    dealerHand = [];
    gameResult = ''; // Clear previous result

    // Deal initial cards
    playerHand.push(dealCard());
    dealerHand.push(dealCard());
    playerHand.push(dealCard());
    dealerHand.push(dealCard());

    const playerValue = getHandValue(playerHand);
    const dealerValue = getHandValue(dealerHand);

    let statusMessage = `New Blackjack game started!\n`;
    statusMessage += `Player's Hand: ${formatHand(playerHand)} (Value: ${playerValue})\n`;
    statusMessage += `Dealer's Hand: ${formatHand(dealerHand, true)} (Value: ${getHandValue([dealerHand[0]])} + ?)\n`;

    // Check for immediate Blackjacks
    if (playerValue === 21 && dealerValue !== 21) {
        endGame('Player has Blackjack! You win!');
        statusMessage += `\n${gameResult}`;
    } else if (dealerValue === 21 && playerValue !== 21) {
        endGame('Dealer has Blackjack! You lose.');
        statusMessage += `\n${gameResult}`;
    } else if (playerValue === 21 && dealerValue === 21) {
        endGame('Both have Blackjack! It\'s a push.');
        statusMessage += `\n${gameResult}`;
    } else {
        statusMessage += `\nPlayer, do you want to 'hit' or 'stand'?`;
    }
    return statusMessage;
}

/**
 * Handles the player's "hit" action.
 * @returns {string} The updated game status message.
 */
function playerHit() {
    if (gameOver) return "Game is over. Please start a new game with `/blackjack deal`.";

    playerHand.push(dealCard());
    const playerValue = getHandValue(playerHand);
    let statusMessage = `Player hits. Your hand: ${formatHand(playerHand)} (Value: ${playerValue})\n`;

    if (playerValue > 21) {
        endGame('Player busts! You lose.');
        statusMessage += `\n${gameResult}`;
    } else if (playerValue === 21) {
        statusMessage += `\nPlayer has 21! Now it's the dealer's turn.`;
        statusMessage += `\n${dealerTurn()}`; // Automatically proceed to dealer's turn
    } else {
        statusMessage += `\nDo you want to 'hit' or 'stand'?`;
    }
    return statusMessage;
}

/**
 * Handles the player's "stand" action.
 * @returns {string} The updated game status message.
 */
function playerStand() {
    if (gameOver) return "Game is over. Please start a new game with `/blackjack deal`.";

    let statusMessage = `Player stands. Dealer's turn...\n`;
    statusMessage += dealerTurn(); // Proceed to dealer's turn
    return statusMessage;
}

/**
 * Simulates the dealer's turn.
 * @returns {string} The final game status message after dealer plays.
 */
function dealerTurn() {
    let dealerValue = getHandValue(dealerHand);
    const playerValue = getHandValue(playerHand);
    let statusMessage = `Dealer's Hand: ${formatHand(dealerHand)} (Value: ${dealerValue})\n`;

    // Dealer hits until 17 or more
    while (dealerValue < 17) {
        dealerHand.push(dealCard());
        dealerValue = getHandValue(dealerHand);
        statusMessage += `Dealer hits. Dealer's Hand: ${formatHand(dealerHand)} (Value: ${dealerValue})\n`;
    }

    // Determine winner
    if (dealerValue > 21) {
        endGame('Dealer busts! You win!');
    } else if (dealerValue > playerValue) {
        endGame('Dealer wins! You lose.');
    } else if (playerValue > dealerValue) {
        endGame('You win!');
    } else {
        endGame('It\'s a push!');
    }
    statusMessage += `\n${gameResult}`;
    return statusMessage;
}

/**
 * Gets the current game status, including hands and values.
 * @returns {Object} An object containing player and dealer hands and values.
 */
function getGameStatus() {
    return {
        playerHand: playerHand,
        playerValue: getHandValue(playerHand),
        dealerHand: dealerHand,
        dealerValue: getHandValue(dealerHand),
        isGameOver: gameOver,
        lastGameResult: gameResult
    };
}

// --- SillyTavern Extension Integration ---

// This function is called when the extension is loaded.
// It's where you register your commands and set up initial listeners.
function onExtensionReady() {
    console.log("[Blackjack Extension] Ready!");

    // Register Commands for SillyTavern Chat
    // These commands will allow you to interact with the game by typing them in chat.

    /**
     * Register the '/blackjack deal' command to start a new game.
     * Usage: /blackjack deal
     */
    registerCommand('blackjack deal', (args) => {
        const status = initGame();
        // Use the SillyTavern API to send a message to the chat.
        // The exact function might be `sendChatMessage`, `processChat`, or `postMessage`.
        // `sendChatMessage` is a common one.
        sendChatMessage(`[Blackjack Game] ${status}`);
    });

    /**
     * Register the '/blackjack hit' command for the player to hit.
     * Usage: /blackjack hit
     */
    registerCommand('blackjack hit', (args) => {
        if (gameOver) {
            sendChatMessage("Game is over. Please start a new game with `/blackjack deal`.");
            return;
        }
        const status = playerHit();
        sendChatMessage(`[Blackjack Game] ${status}`);
    });

    /**
     * Register the '/blackjack stand' command for the player to stand.
     * Usage: /blackjack stand
     */
    registerCommand('blackjack stand', (args) => {
        if (gameOver) {
            sendChatMessage("Game is over. Please start a new game with `/blackjack deal`.");
            return;
        }
        const status = playerStand();
        sendChatMessage(`[Blackjack Game] ${status}`);
    });

    /**
     * Register the '/blackjack status' command to check the current game status.
     * Usage: /blackjack status
     */
    registerCommand('blackjack status', (args) => {
        const status = getGameStatus();
        let msg = `[Blackjack Status]\n`;
        msg += `Player's Hand: ${formatHand(status.playerHand)} (Value: ${status.playerValue})\n`;
        msg += `Dealer's Hand: ${formatHand(status.dealerHand, true)} (Value: ${getHandValue([status.dealerHand[0]])} + ?)\n`;
        msg += `Game Over: ${status.isGameOver ? 'Yes' : 'No'}\n`;
        if (status.isGameOver) {
            msg += `Last Result: ${status.lastGameResult}`;
        }
        sendChatMessage(msg);
    });

    console.log("[Blackjack Extension] All commands registered.");
}

// SillyTavern extensions typically export an object with lifecycle methods.
export {
    onExtensionReady
};
