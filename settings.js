// settings.js - Settings for the Blackjack Game SillyTavern Extension

// This function is called by SillyTavern to get the extension's settings structure.
function getSettings() {
    return [
        {
            id: 'blackjack_game_setting_example',
            name: 'Example Setting',
            type: 'checkbox', // or 'text', 'number', 'select'
            default: true,
            description: 'This is an example setting for the Blackjack game extension. You can add more here.',
            onChange: (value) => {
                // This function runs when the setting is changed by the user.
                console.log(`[Blackjack Extension Settings] Example setting changed to: ${value}`);
                // You could use this to modify game behavior, e.g., enable/disable hints.
            }
        }
    ];
}

// SillyTavern extensions typically export an object with lifecycle methods.
export {
    getSettings
};
