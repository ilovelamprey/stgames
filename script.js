import { SlashCommandParser } from '../../../slash-commands/SlashCommandParser.js';
import { SlashCommand } from '../../../slash-commands/SlashCommand.js';
import { getContext } from '../../../extensions.js';

(async function() {
    console.log('[Blackjack] Extension script started.');

    // --- Core Context ---
    const { eventSource, event_types } = getContext();

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
        console.log('[Blackjack] Running resolveGame...');
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
        console.log('[Blackjack] Game resolved. Message:', message);
        return message;
    };

    // --- Command Handlers ---
    const startBlackjack = async () => {
        console.log('[Blackjack] /blackjack command called. Starting new game...');
        gameInProgress = true;
        deck = createDeck();
        playerHand = [deck.pop(), deck.pop()];
        dealerHand = [deck.pop(), deck.pop()];
        const playerScore = calculateScore(playerHand);
        const dealerCardString = getHandString([dealerHand[0]]);
        const message = `Let's play blackjack! You were dealt: ${getHandString(playerHand)} (Score: ${playerScore}). The dealer's visible card is: ${dealerCardString}. Use **/hit** to take another card or **/stand** to end your turn.`;
        console.log('[Blackjack] New game started. Message:', message);
        return message;
    };

    const hit = async () => {
        console.log('[Blackjack] /hit command called.');
        if (!gameInProgress) {
            console.log('[Blackjack] No game in progress.');
            return 'No game in progress. Use **/blackjack** to start a new game.';
        }
        playerHand.push(deck.pop());
        const playerScore = calculateScore(playerHand);
        const playerHandString = getHandString(playerHand);
        let response = `You took another card. Your new hand is: ${playerHandString} (Score: ${playerScore}).`;
        console.log('[Blackjack] Player hit. New hand message:', response);
        if (playerScore > 21) {
            console.log('[Blackjack] Player bust.');
            response += '\n' + await resolveGame();
        }
        return response;
    };

    const stand = async () => {
        console.log('[Blackjack] /stand command called.');
        if (!gameInProgress) {
            console.log('[Blackjack] No game in progress.');
            return 'No game in progress. Use **/blackjack** to start a new game.';
        }
        console.log('[Blackjack] Player stands. Dealer turn.');
        dealerPlay();
        return await resolveGame();
    };

    // --- Command Registration ---
    try {
        SlashCommandParser.addCommandObject(SlashCommand.fromProps({
            name: 'blackjack',
            aliases: ['bj'],
            helpString: 'Starts a new game of blackjack.',
            callback: startBlackjack,
        }));
        
        SlashCommandParser.addCommandObject(SlashCommand.fromProps({
            name: 'hit',
            helpString: 'Take another card in blackjack.',
            callback: hit,
        }));
        
        SlashCommandParser.addCommandObject(SlashCommand.fromProps({
            name: 'stand',
            helpString: 'End your turn in blackjack.',
            callback: stand,
        }));
        
        console.log('[Blackjack] All slash commands registered successfully.');
    } catch (e) {
        console.error('[Blackjack] ERROR: Failed to register slash commands.', e);
    }
})();
