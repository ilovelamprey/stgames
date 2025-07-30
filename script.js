(async function() {
    console.log('[Blackjack] Extension script started.');

    // We get the necessary functions directly from the SillyTavern context.
    const {
        registerSlashCommand,
        eventSource,
        event_types
    } = SillyTavern.getContext();

    // --- Blackjack Game State ---
    let deck = [], playerHand = [], dealerHand = [], gameInProgress = false;

    // --- Game Logic Functions ---
    const createDeck = () => {
        const suits = ['♥', '♦', '♣', '♠'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        const newDeck = [];
        for (const suit of suits) {
            for (const rank of ranks) {
                let value = parseInt(rank);
                if (['J', 'Q', 'K'].includes(rank)) value = 10;
                if (rank === 'A') value = 11;
                newDeck.push({ suit, rank, value });
            }
        }
        return newDeck.sort(() => Math.random() - 0.5);
    };

    const calculateScore = (hand) => {
        let score = hand.reduce((sum, card) => sum + card.value, 0);
        let aces = hand.filter(card => card.rank === 'A').length;
        while (score > 21 && aces > 0) {
            score -= 10;
            aces--;
        }
        return score;
    };

    const getHandString = (hand) => hand.map(card => `${card.rank}${card.suit}`).join(', ');

    const dealerPlay = () => {
        while (calculateScore(dealerHand) < 17) {
            dealerHand.push(deck.pop());
        }
    };

    const resolveGame = () => {
        const playerScore = calculateScore(playerHand);
        const dealerScore = calculateScore(dealerHand);
        let result = '';

        if (playerScore > 21) {
            result = `You bust with a score of ${playerScore}. The dealer wins!`;
        } else if (dealerScore > 21) {
            result = `The dealer busts with a score of ${dealerScore}. You win!`;
        } else if (playerScore > dealerScore) {
            result = `You win with a score of ${playerScore} against the dealer's ${dealerScore}.`;
        } else if (dealerScore > playerScore) {
            result = `The dealer wins with a score of ${dealerScore} against your ${playerScore}.`;
        } else {
            result = `It's a push! You both have a score of ${playerScore}.`;
        }

        const dealerHandString = getHandString(dealerHand);
        gameInProgress = false;

        return `**BLACKJACK GAME RESULT**
Your hand: ${getHandString(playerHand)} (Score: ${playerScore})
Dealer's hand: ${dealerHandString} (Score: ${dealerScore})
***${result}***`;
    };

    // --- Slash Command Registration ---
    // This is the key change: we use the simpler, deprecated method.
    // The function returns a string, which SillyTavern then renders in the chat.

    registerSlashCommand('blackjack', (args) => {
        if (gameInProgress) {
            return 'A game is already in progress. Use /hit or /stand to continue.';
        }
        gameInProgress = true;
        deck = createDeck();
        playerHand = [deck.pop(), deck.pop()];
        dealerHand = [deck.pop(), deck.pop()];

        const playerScore = calculateScore(playerHand);
        const dealerCardString = getHandString([dealerHand[0]]);

        return `Let's play blackjack! You were dealt: ${getHandString(playerHand)} (Score: ${playerScore}). The dealer's visible card is: ${dealerCardString}. Use **/hit** to take another card or **/stand** to end your turn.`;
    });

    registerSlashCommand('hit', (args) => {
        if (!gameInProgress) {
            return 'No game in progress. Use /blackjack to start a new game.';
        }

        playerHand.push(deck.pop());
        const playerScore = calculateScore(playerHand);

        if (playerScore > 21) {
            return resolveGame();
        } else {
            const playerHandString = getHandString(playerHand);
            return `You took another card. Your new hand is: ${playerHandString} (Score: ${playerScore}).`;
        }
    });

    registerSlashCommand('stand', (args) => {
        if (!gameInProgress) {
            return 'No game in progress. Use /blackjack to start a new game.';
        }

        dealerPlay();
        return resolveGame();
    });

    console.log('[Blackjack] Slash commands registered successfully.');
})();
