(async function() {
    console.log('[Blackjack] Extension script started.');

    let SlashCommandParser;
    let SlashCommand;
    let eventSource;
    let event_types;

    try {
        // We will try to import the core modules directly.
        // This is the most reliable way to get these objects.
        const modules = await import('../../../extensions.js');
        const scriptModules = await import('../../../../script.js');

        SlashCommandParser = scriptModules.SlashCommandParser;
        SlashCommand = scriptModules.SlashCommand;

        const context = modules.getContext();
        eventSource = context.eventSource;
        event_types = context.event_types;

    } catch (e) {
        console.error('[Blackjack] ERROR: Failed to get core modules. Command registration will fail.', e);
        return;
    }

    // --- CRITICAL CHECK ---
    if (!SlashCommandParser || !SlashCommand) {
        console.error('[Blackjack] CRITICAL ERROR: SlashCommandParser or SlashCommand are undefined after import. Command registration will fail.');
        return;
    }

    // --- Slash Command Registration ---
    // This is the correct, modern method to register a command.
    // The format is what caused the last error.
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'blackjack',
        aliases: ['bj'],
        helpString: 'Starts a new game of blackjack.',
        callback: async () => {
            console.log('[Blackjack] /blackjack command called.');
            return 'The /blackjack command has been registered and is working!';
        },
    }));

    console.log('[Blackjack] Slash command registered successfully.');
})();
