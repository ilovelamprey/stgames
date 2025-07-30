(async function() {
    console.log('[Blackjack] Extension script started.');

    const {
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

    const resolveGame = async () => {
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

        const message = `**BLACKJACK GAME RESULT**
Your hand: ${getHandString(playerHand)} (Score: ${playerScore})
Dealer's hand: ${dealerHandString} (Score: ${dealerScore})
***${result}***`;

        await eventSource.emit(event_types.CHARACTER_MESSAGE_RENDERED, { mes: message });
    };

    // --- PROMPT INTERCEPTOR ---
    // This function will be called before AI generation.
    globalThis.blackjackInterceptor = async function(chat, contextSize, abort, type) {
        if (chat.length === 0) return;

        const lastMessage = chat[chat.length - 1];
        const userCommand = lastMessage.mes.trim();
        let messageToInject = null;

        if (userCommand === '/blackjack' || userCommand === '/bj') {
            gameInProgress = true;
            deck = createDeck();
            playerHand = [deck.pop(), deck.pop()];
            dealerHand = [deck.pop(), deck.pop()];
            const playerScore = calculateScore(playerHand);
            const dealerCardString = getHandString([dealerHand[0]]);
            messageToInject = `Let's play blackjack! You were dealt: ${getHandString(playerHand)} (Score: ${playerScore}). The dealer's visible card is: ${dealerCardString}. Use **/hit** to take another card or **/stand** to end your turn.`;
            abort(true);
        } else if (userCommand === '/hit') {
            if (!gameInProgress) {
                messageToInject = 'No game in progress. Use **/blackjack** to start a new game.';
            } else {
                playerHand.push(deck.pop());
                const playerScore = calculateScore(playerHand);
                const playerHandString = getHandString(playerHand);
                messageToInject = `You took another card. Your new hand is: ${playerHandString} (Score: ${playerScore}).`;
                if (playerScore > 21) {
                    await resolveGame();
                }
            }
            abort(true);
        } else if (userCommand === '/stand') {
            if (!gameInProgress) {
                messageToInject = 'No game in progress. Use **/blackjack** to start a new game.';
            } else {
                dealerPlay();
                await resolveGame();
            }
            abort(true);
        }

        if (messageToInject) {
            // We use emit here because we are inside a different context
            // and we can't simply return a string.
            await eventSource.emit(event_types.CHARACTER_MESSAGE_RENDERED, { mes: messageToInject });
            // We also need to remove the user's command message from the chat to not confuse the AI.
            chat.pop();
        }
    };

    console.log('[Blackjack] Interceptor loaded successfully.');
})();
