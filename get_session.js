const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input');

const apiId = '18889294';    // Put your api_id here
const apiHash = '0bd1b2fd06013f1f1d7e111df28f7e31'; // Put your api_hash here

(async () => {
    console.log('Loading interactive example...');
    const stringSession = new StringSession(''); // Fill this later with the value from session.save()
    
    const client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
    });
    
    await client.start({
        phoneNumber: async () => await input.text('Please enter your phone number: '),
        password: async () => await input.text('Please enter your password: '),
        phoneCode: async () => await input.text('Please enter the code you received: '),
        onError: (err) => console.log(err),
    });
    
    console.log('You should now be connected.');
    console.log('Session string:', client.session.save()); // Save this string to use in your server
})(); 