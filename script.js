// --- "Debug" Version of script.js ---

console.log('[Blackjack] Script execution started.');

try {
    const { SlashCommand, SlashCommandParser } = await import('../../../../script.js');
    console.log('[Blackjack] SillyTavern modules (SlashCommand, SlashCommandParser) imported successfully.');

    // --- The Blackjack Game Logic (Unchanged) ---
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
        return deck.sort(() => Math.random() - 0.5);
    };
    let deck = [], playerHand = [], dealerHand = [], gameInProgress = false;
    const calculateScore = (hand) => {
        let score = hand.reduce((sum, card) => sum + card.value, 0);
        let aces = hand.filter(card => card.rank === 'A').length;
        while (score > 21 && aces > 0) { score -= 10; aces--; }
        return score;
    };
    const startGame = () => {
        if (gameInProgress) return;
        gameInProgress = true;
        deck = createDeck();
        playerHand = [deck.pop(), deck.pop()];
        dealerHand = [deck.pop(), deck.pop()];
        createGameUI();
        updateUI();
    };
    const createGameUI = () => {
        if (document.getElementById('blackjack-container')) document.getElementById('blackjack-container').remove();
        const gameContainer = document.createElement('div');
        gameContainer.id = 'blackjack-container';
        gameContainer.innerHTML = `
            <div class="blackjack-board"><h2>Blackjack</h2><div class="hand-container"><p>Dealer's Hand (<span id="dealer-score"></span>)</p><div id="dealer-hand" class="hand"></div></div><div class="hand-container"><p>Your Hand (<span id="player-score"></span>)</p><div id="player-hand" class="hand"></div></div><div class="buttons"><button id="hit-button">Hit</button><button id="stand-button">Stand</button></div></div>`;
        document.body.appendChild(gameContainer);
        document.getElementById('hit-button').addEventListener('click', playerHit);
        document.getElementById('stand-button').addEventListener('click', playerStand);
    };
    const updateUI = (revealDealerCard = false) => {
        document.getElementById('player-hand').innerHTML = playerHand.map(card => `<div class="card">${card.rank}${card.suit}</div>`).join('');
        document.getElementById('player-score').textContent = calculateScore(playerHand);
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
    const playerHit = () => {
        playerHand.push(deck.pop());
        updateUI();
        if (calculateScore(playerHand) > 21) endGame('lost by busting');
    };
    const playerStand = () => {
        document.getElementById('hit-button').disabled = true;
        document.getElementById('stand-button').disabled = true;
        let dealerScore = calculateScore(dealerHand);
        while (dealerScore < 17) { dealerHand.push(deck.pop()); dealerScore = calculateScore(dealerHand); }
        updateUI(true);
        const playerScore = calculateScore(playerHand);
        if (dealerScore > 21 || playerScore > dealerScore) endGame(`won with ${playerScore} vs the dealer's ${dealerScore}`);
        else if (playerScore < dealerScore) endGame(`lost with ${playerScore} vs the dealer's ${dealerScore}`);
        else endGame('pushed (tied)');
    };
    const endGame = (resultText) => {
        gameInProgress = false;
        const context = SillyTavern.getContext();
        const characterName = context.characters[context.characterId].name;
        const message = `*[Plays a game of blackjack with ${characterName}. I ${resultText}.]*`;
        const textarea = document.getElementById('send_textarea');
        const sendButton = document.getElementById('send_but');
        textarea.value = message;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        sendButton.click();
        setTimeout(() => { if(document.getElementById('blackjack-container')) document.getElementById('blackjack-container').remove(); }, 500);
    };

    // --- Command Registration with Debugging ---
    console.log('[Blackjack] Setting up APP_READY event listener.');
    SillyTavern.getContext().eventSource.on(SillyTavern.getContext().event_types.APP_READY, () => {
        console.log('[Blackjack] APP_READY event fired. Attempting to register command.');
        try {
            SlashCommandParser.addCommandObject(SlashCommand.fromProps({
                name: 'blackjack',
                callback: () => { startGame(); return ''; },
                returns: 'a blackjack game UI',
                helpString: 'Type /blackjack to start a new game.',
            }));
            console.log('[Blackjack] /blackjack command successfully registered!');
        } catch (e) {
            console.error('[Blackjack] CRITICAL ERROR during command registration:', e);
        }
    });

} catch (e) {
    console.error('[Blackjack] FAILED to load dependencies or execute initial script:', e);
}
