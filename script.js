(async function() {
    console.log('[Test] Extension script started.');

    try {
        const { registerSlashCommand } = SillyTavern.getContext();

        registerSlashCommand('test', (args) => {
            console.log('[Test] /test command called.');
            return 'Hello, world!';
        });

        console.log('[Test] Slash command registered successfully.');
    } catch (e) {
        console.error('[Test] ERROR: Failed to register slash command.', e);
    }
})();
