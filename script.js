import { SlashCommandParser } from '../../../slash-commands/SlashCommandParser.js';
import { SlashCommand } from '../../../slash-commands/SlashCommand.js';
import { getContext } from '../../../extensions.js';

(async function() {
    const { executeSlashCommandsWithOptions, name1 } = SillyTavern.getContext();

    // A function that sends a message from a specified name using /sys
    const sendMessage = (senderName, message) => {
        executeSlashCommandsWithOptions(`/sys name=${senderName} ${message}`);
    };

    sendMessage('[Blackjack & Yahtzee Extension]', 'Extension script started.');

    // --- Game States ---
    let blackjackInProgress = false;
    let yahtzeeInProgress = false;

    // Blackjack Game State
    let blackjackDeck = [], playerHand = [], dealerHand = [];

    // Yahtzee Game State
    let yahtzeeDice = [], rollsLeft = 0;

    // --- Common Game Logic Functions ---
    const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    // --- Blackjack Game Logic Functions ---
    const createBlackjackDeck = () => {
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

    const calculateBlackjackScore = (hand) => {
        let score = hand.reduce((sum, card) => sum + card.value, 0);
        let aces = hand.filter(card => card.rank === 'A').length;
        while (score > 21 && aces > 0) {
            score -= 10;
            aces--;
        }
        return score;
    };

    const getBlackjackHandString = (hand) => hand.map(card => `${card.rank}${card.suit}`).join(', ');

    const blackjackDealerPlay = () => {
        while (calculateBlackjackScore(dealerHand) < 17) {
            dealerHand.push(blackjackDeck.pop());
        }
    };

    const resolveBlackjackGame = async () => {
        const playerScore = calculateBlackjackScore(playerHand);
        const dealerScore = calculateBlackjackScore(dealerHand);
        let result = '';

        if (playerScore > 21) {
            result = `${name1} busts with a score of ${playerScore}. I win!`;
        } else if (dealerScore > 21) {
            result = `I bust with a score of ${dealerScore}. ${name1} wins!`;
        } else if (playerScore > dealerScore) {
            result = `${name1} wins with a score of ${playerScore} against my ${dealerScore}.`;
        } else if (dealerScore > playerScore) {
            result = `I win with a score of ${dealerScore} against ${name1}'s ${playerScore}.`;
        } else {
            result = `It's a push! We both have a score of ${playerScore}.`;
        }

        const dealerHandString = getBlackjackHandString(dealerHand);
        blackjackInProgress = false;

        return `**BLACKJACK GAME RESULT**
${name1}'s hand: ${getBlackjackHandString(playerHand)} (Score: ${playerScore})
My hand: ${dealerHandString} (Score: ${dealerScore})
***${result}***`;
    };

    // --- Yahtzee Game Logic Functions ---
    const rollYahtzeeDice = (numDice = 5) => {
        const newRoll = [];
        for (let i = 0; i < numDice; i++) {
            newRoll.push(getRandomInt(1, 6));
        }
        return newRoll;
    };

    const getDiceString = (dice) => dice.join(', ');

    const calculateYahtzeeScores = (dice) => {
        const counts = {};
        for (const die of dice) {
            counts[die] = (counts[die] || 0) + 1;
        }
        const values = Object.keys(counts).map(Number).sort((a, b) => a - b);
        const uniqueCount = values.length;
        const countValues = Object.values(counts).sort((a, b) => a - b);

        const scores = {};

        // Ones through Sixes
        for (let i = 1; i <= 6; i++) {
            scores[`${i}s`] = (counts[i] || 0) * i;
        }

        // Three of a Kind
        if (countValues.some(c => c >= 3)) {
            scores['Three of a Kind'] = dice.reduce((sum, d) => sum + d, 0);
        }

        // Four of a Kind
        if (countValues.some(c => c >= 4)) {
            scores['Four of a Kind'] = dice.reduce((sum, d) => sum + d, 0);
        }

        // Full House
        if (countValues.includes(2) && countValues.includes(3)) {
            scores['Full House'] = 25;
        }

        // Small Straight (4 in a row)
        const sortedUnique = Array.from(new Set(dice)).sort((a, b) => a - b);
        let straightLength = 0;
        let maxStraightLength = 0;
        for (let i = 0; i < sortedUnique.length; i++) {
            if (i > 0 && sortedUnique[i] === sortedUnique[i - 1] + 1) {
                straightLength++;
            } else {
                straightLength = 1;
            }
            maxStraightLength = Math.max(maxStraightLength, straightLength);
        }
        if (maxStraightLength >= 4) {
            scores['Small Straight'] = 30;
        }
        
        // Large Straight (5 in a row)
        if (maxStraightLength >= 5) {
             scores['Large Straight'] = 40;
        }


        // Yahtzee (5 of a Kind)
        if (countValues.includes(5)) {
            scores['Yahtzee'] = 50;
        }

        // Chance
        scores['Chance'] = dice.reduce((sum, d) => sum + d, 0);

        return scores;
    };

    // --- Command Handlers ---

    // Blackjack Commands
    const startBlackjack = async () => {
        if (yahtzeeInProgress) {
            sendMessage(`Lauren`, `A Yahtzee game is in progress! Please finish it first or use **/yahtzee stop**.`);
            return '';
        }
        blackjackInProgress = true;
        blackjackDeck = createBlackjackDeck();
        playerHand = [blackjackDeck.pop(), blackjackDeck.pop()];
        dealerHand = [blackjackDeck.pop(), blackjackDeck.pop()];
        const playerScore = calculateBlackjackScore(playerHand);
        const dealerCardString = getBlackjackHandString([dealerHand[0]]);
        const message = `Let's play blackjack! You were dealt: ${getBlackjackHandString(playerHand)} (Score: ${playerScore}). My visible card is: ${dealerCardString}. Use **/hit** to take another card or **/stand** to end your turn.`;
        
        sendMessage("Lauren", message);
        return '';
    };

    const hit = async () => {
        if (!blackjackInProgress) {
            return 'No Blackjack game in progress. Use **/blackjack** to start a new game.';
        }
        playerHand.push(blackjackDeck.pop());
        const playerScore = calculateBlackjackScore(playerHand);

        if (playerScore > 21) {
            const finalMessage = `You took another card. Your new hand is: ${getBlackjackHandString(playerHand)} (Score: ${playerScore}).\n\n` + await resolveBlackjackGame();
            sendMessage("Lauren", finalMessage);
            blackjackInProgress = false; // Ensure game is marked as ended
        } else {
            const message = `You took another card. Your new hand is: ${getBlackjackHandString(playerHand)} (Score: ${playerScore}).`;
            sendMessage("Lauren", message);
        }
        return '';
    };

    const stand = async () => {
        if (!blackjackInProgress) {
            return 'No Blackjack game in progress. Use **/blackjack** to start a new game.';
        }
        blackjackDealerPlay();
        const message = await resolveBlackjackGame();
        sendMessage("Lauren", message);
        blackjackInProgress = false; // Ensure game is marked as ended
        return '';
    };

    // Yahtzee Commands
    const startYahtzee = async () => {
        if (blackjackInProgress) {
            sendMessage("Lauren", `A Blackjack game is in progress! Please finish it first or use **/blackjack stop**.`);
            return '';
        }
        yahtzeeInProgress = true;
        rollsLeft = 2; // 1 initial roll + 2 re-rolls
        yahtzeeDice = rollYahtzeeDice();
        const message = `Let's play Yahtzee! You rolled: ${getDiceString(yahtzeeDice)}. You have ${rollsLeft} rolls left. Use **/reroll [dice numbers]** (e.g., **/reroll 1 3 5**) or **/score** to end your turn.`;
        
        sendMessage("Lauren", message);
        return '';
    };

    const rerollDice = async (rawArgs) => {
        if (!yahtzeeInProgress) {
            return 'No Yahtzee game in progress. Use **/yahtzee** to start a new turn.';
        }
        if (rollsLeft <= 0) {
            sendMessage("Lauren", `You have no rolls left! Please use **/score** to end your turn.`);
            return '';
        }

        const diceToKeep = rawArgs ? rawArgs.split(' ').map(Number).filter(n => !isNaN(n) && n >= 1 && n <= 5) : [];
        const newDice = [];
        for (let i = 0; i < 5; i++) {
            if (diceToKeep.includes(i + 1)) {
                newDice.push(yahtzeeDice[i]); // Keep this die
            } else {
                newDice.push(getRandomInt(1, 6)); // Roll new die
            }
        }
        yahtzeeDice = newDice;
        rollsLeft--;

        let message = `You re-rolled! Your dice are now: ${getDiceString(yahtzeeDice)}. You have ${rollsLeft} rolls left.`;
        if (rollsLeft <= 0) {
            message += `\n\nYou have no more rolls left. Use **/score** to end your turn.`;
        } else {
            message += ` Use **/reroll [dice numbers]** or **/score** to end your turn.`;
        }

        sendMessage("Lauren", message);
        return '';
    };

    const scoreYahtzeeTurn = async () => {
        if (!yahtzeeInProgress) {
            return 'No Yahtzee game in progress. Use **/yahtzee** to start a new turn.';
        }

        const scores = calculateYahtzeeScores(yahtzeeDice);
        let scoreMessage = `**YAHTZEE TURN RESULT**\nYour final dice: ${getDiceString(yahtzeeDice)}\n\nPossible Scores:\n`;
        
        let bestScore = 0;
        let bestCategory = 'No good option';

        for (const category in scores) {
            scoreMessage += `- ${category}: ${scores[category]}\n`;
            if (scores[category] > bestScore) {
                bestScore = scores[category];
                bestCategory = category;
            }
        }
        scoreMessage += `\n***The best score you could get is ${bestScore} for "${bestCategory}".***`;

        yahtzeeInProgress = false;
        sendMessage("Lauren", scoreMessage);
        return '';
    };

    // --- Command Registration ---
    try {
        // Blackjack Commands
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

        // Yahtzee Commands
        SlashCommandParser.addCommandObject(SlashCommand.fromProps({
            name: 'yahtzee',
            aliases: ['yz'],
            helpString: 'Starts a new turn of Yahtzee (3 rolls total).',
            callback: startYahtzee,
        }));

        SlashCommandParser.addCommandObject(SlashCommand.fromProps({
            name: 'reroll',
            helpString: 'Re-rolls specified dice in Yahtzee. Usage: /reroll 1 3 5 (to re-roll dice 1, 3, and 5)',
            arguments: [
                SlashCommandParser.makeUnnamedArgument('diceToReroll', { type: 'string', optional: true, help: 'Numbers of dice to re-roll (1-5), space-separated.' })
            ],
            callback: (args) => rerollDice(args.diceToReroll),
        }));

        SlashCommandParser.addCommandObject(SlashCommand.fromProps({
            name: 'score',
            helpString: 'Ends your Yahtzee turn and shows possible scores.',
            callback: scoreYahtzeeTurn,
        }));
        
        sendMessage('[Blackjack & Yahtzee Extension]', 'All slash commands registered successfully.');
    } catch (e) {
        sendMessage('[Blackjack & Yahtzee Extension]', `ERROR: Failed to register slash commands: ${e.message}`);
    }
})();
