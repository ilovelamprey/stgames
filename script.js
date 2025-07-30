(async function() {
    console.log('[Blackjack] Extension script started.');

    try {
        const { registerSlashCommand } = SillyTavern.getContext();

        registerSlashCommand('blackjack', (args) => {
            console.log('[Blackjack] /blackjack command called.');
            return 'The /blackjack command has been registered and is working!';
        });

        console.log('[Blackjack] Slash command registered successfully.');
    } catch (e) {
        console.error('[Blackjack] ERROR: Failed to register slash command.', e);
    }
})();
