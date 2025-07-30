(async function() {
    console.log('[Blackjack] Extension script started.');

    let SlashCommandParser;
    let SlashCommand;
    let eventSource;
    let event_types;

    try {
        // We will first try to get the modules from the main script file.
        const modules = await import('../../../../script.js');
        SlashCommandParser = modules.SlashCommandParser;
        SlashCommand = modules.SlashCommand;
        
        // We get event modules from the context, as they are known to be there.
        const context = SillyTavern.getContext();
        eventSource = context.eventSource;
        event_types = context.event_types;
        
    } catch (e) {
        console.error('[Blackjack] Failed to get command modules via import, falling back to getContext(). Error:', e);
        // If the import fails, we will fall back to trying to get everything from the context.
        const context = SillyTavern.getContext();
        SlashCommandParser = context.SlashCommandParser;
        SlashCommand = context.SlashCommand;
        eventSource = context.eventSource;
        event_types = context.event_types;
    }
    
    // --- CRITICAL CHECK ---
    // We must ensure the required modules were found before trying to use them.
    if (!SlashCommandParser || !SlashCommand) {
        console.error('[Blackjack] CRITICAL ERROR: Could not find SlashCommandParser or SlashCommand modules. Command registration will fail.');
        // We will return here to prevent the TypeError.
        return;
    }
    
    // --- Blackjack Game State ---
    const MODULE_NAME = 'blackjack_game';
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
***${result}***
`;
        await eventSource.emit(event_types.CHARACTER_MESSAGE_RENDERED, { mes: message });
    };

    // --- Slash Command Registration ---

    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'blackjack',
        aliases: ['bj'],
        helpString: 'Starts a new game of blackjack.',
        callback: async (namedArgs, unnamedArgs) => {
            if (gameInProgress) {
                return 'A game is already in progress. Use /hit or /stand to continue, or wait for the current game to finish.';
            }

            gameInProgress = true;
            deck = createDeck();
            playerHand = [deck.pop(), deck.pop()];
            dealerHand = [deck.pop(), deck.pop()];

            const playerScore = calculateScore(playerHand);
            const dealerCardString = getHandString([dealerHand[0]]);

            const introMessage = `Let's play blackjack! You were dealt: ${getHandString(playerHand)} (Score: ${playerScore}). The dealer's visible card is: ${dealerCardString}. Use **/hit** to take another card or **/stand** to end your turn.`;

            await eventSource.emit(event_types.CHARACTER_MESSAGE_RENDERED, { mes: introMessage });
            return '';
        }
    }));

    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'hit',
        helpString: 'Takes another card in blackjack.',
        callback: async (namedArgs, unnamedArgs) => {
            if (!gameInProgress) {
                return 'No game in progress. Use **/blackjack** to start a new game.';
            }

            playerHand.push(deck.pop());
            const playerScore = calculateScore(playerHand);
            const playerHandString = getHandString(playerHand);

            const hitMessage = `You took another card. Your new hand is: ${playerHandString} (Score: ${playerScore}).`;

            await eventSource.emit(event_types.CHARACTER_MESSAGE_RENDERED, { mes: hitMessage });

            if (playerScore > 21) {
                await resolveGame();
            }

            return '';
        }
    }));

    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'stand',
        helpString: 'Ends your turn in blackjack.',
        callback: async (namedArgs, unnamedArgs) => {
            if (!gameInProgress) {
                return 'No game in progress. Use **/blackjack** to start a new game.';
            }

            dealerPlay();
            await resolveGame();
            return '';
        }
    }));

    console.log('[Blackjack] Slash commands registered successfully.');

})();
