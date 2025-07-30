import { SlashCommandParser } from '../../../slash-commands/SlashCommandParser.js';
import { SlashCommand } from '../../../slash-commands/SlashCommand.js';
import { getContext } from '../../../extensions.js';

(async function() {
    const { executeSlashCommandsWithOptions, name1 } = SillyTavern.getContext();
    const name2 = 'Lauren';
    console.log(name1);
    console.log(name2);

    const sendSysMessage = (message) => {
        executeSlashCommandsWithOptions(`/sys ${message}`);
    };

    sendSysMessage('[Blackjack] Extension script started.');

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
            result = `${name1} busts with a score of ${playerScore}. Lauren wins!`;
        } else if (dealerScore > 21) {
            result = `Lauren busts with a score of ${dealerScore}. ${name1} wins!`;
        } else if (playerScore > dealerScore) {
            result = `${name1} wins with a score of ${playerScore} against Lauren's ${dealerScore}.`;
        } else if (dealerScore > playerScore) {
            result = `Lauren wins with a score of ${dealerScore} against ${name1}'s ${playerScore}.`;
        } else {
            result = `It's a push! You both have a score of ${playerScore}.`;
        }

        const dealerHandString = getHandString(dealerHand);
        gameInProgress = false;

        return `**BLACKJACK GAME RESULT**
${name1}'s hand: ${getHandString(playerHand)} (Score: ${playerScore})
Lauren's hand: ${dealerHandString} (Score: ${dealerScore})
***${result}***`;
    };

    // --- Command Handlers ---
    const startBlackjack = async () => {
        gameInProgress = true;
        deck = createDeck();
        playerHand = [deck.pop(), deck.pop()];
        dealerHand = [deck.pop(), deck.pop()];
        const playerScore = calculateScore(playerHand);
        const dealerCardString = getHandString([dealerHand[0]]);
        const message = `Let's play blackjack! ${name1} was dealt: ${getHandString(playerHand)} (Score: ${playerScore}). Lauren's visible card is: ${dealerCardString}. Use **/hit** to take another card or **/stand** to end ${name1}'s turn.`;
        
        sendSysMessage(message);
        return '';
    };

    const hit = async () => {
        if (!gameInProgress) {
            return 'No game in progress. Use **/blackjack** to start a new game.';
        }
        playerHand.push(deck.pop());
        const playerScore = calculateScore(playerHand);

        if (playerScore > 21) {
            const finalMessage = `${name1} took another card. ${name1}'s new hand is: ${getHandString(playerHand)} (Score: ${playerScore}).\n\n` + await resolveGame();
            sendSysMessage(finalMessage);
        } else {
            const message = `${name1} took another card. ${name1}'s new hand is: ${getHandString(playerHand)} (Score: ${playerScore}).`;
            sendSysMessage(message);
        }
        return '';
    };

    const stand = async () => {
        if (!gameInProgress) {
            return 'No game in progress. Use **/blackjack** to start a new game.';
        }
        dealerPlay();
        const message = await resolveGame();
        sendSysMessage(message);
        return '';
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
        
        sendSysMessage('[Blackjack] All slash commands registered successfully.');
    } catch (e) {
        sendSysMessage('[Blackjack] ERROR: Failed to register slash commands.');
    }
})();
