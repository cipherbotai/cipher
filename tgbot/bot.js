const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Replace 'YOUR_BOT_TOKEN' with the token from BotFather
const token = '7691563917:AAEIlZt5HNaYWjJu2mSJjVQ33OPvuliFWMM';

// Create a bot instance
const bot = new TelegramBot(token, { polling: true });

// API endpoints
const API_BASE_URL = 'http://localhost:3001';

// Welcome image URL
const WELCOME_IMAGE = path.join(__dirname, '..', 'tgimg.png');

// Handle /start command
bot.onText(/\/start/, async (msg) => {
  try {
    const chatId = msg.chat.id;
    
    // Increment counter
    const postResponse = await axios.post(`${API_BASE_URL}/counter`);
    const newCount = postResponse.data.value;
    
    // First send the image
    await bot.sendPhoto(chatId, fs.createReadStream(WELCOME_IMAGE));
    
//     const message = `🌟 Welcome to Cipher Trading Bot!

// All spots are currently filled: 500/500 🔒

// You are on the waitlist at position: #${newCount} 📋

// Stay tuned for updates on new spot availability! ⏳

// Join our community to stay informed! 🚀`;

const message = `🌟 Welcome to Cipher Trading Bot!

Available spots are currently : 1/500 🔒

You have already setup your wallet.

Have fun trading! 🚀`;



    bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        remove_keyboard: true
      }
    });
  } catch (error) {
    console.error('Error:', error.message);
    bot.sendMessage(msg.chat.id, '❌ Sorry, there was an error processing your request.');
  }
});

// Add this handler after the /start command
bot.onText(/\/buy (.+)/, async (msg, match) => {
  try {
    const chatId = msg.chat.id;
    const params = match[1].split(' '); // Split parameters by space
    
    // Check if parameters are provided
    if (!params || params.length < 2) {
      return bot.sendMessage(chatId, `❌ Invalid format. Please use:
/buy <amount> <token>

Example: /buy 1000 PEPE`);
    }

    const amount = params[0];
    const token = params[1];
    const marketPrice = params[2];
    const tokenAmount = params[3];
    const contractAddress = params[4];

    const message = `🟢 New Buy Order Confirmed:

📛Token: \`${token}\`
🔖CA: \`${contractAddress}\`
💲Amount: \`${amount}\` SOL ⇄ \`${tokenAmount}\` \`${token}\`
💰Market Cap: \`$${marketPrice}\`

💳Buying Wallet: \`test\`

[View Transaction](https://etherscan.io/tx/0x123)
`;


    bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📊 Positions', callback_data: 'positions' },
            { text: '💰 Sell Panel', callback_data: 'sell_panel' }
          ],
          [
            { text: 'Sell 25%', callback_data: 'sell_25' },
            { text: 'Sell 50%', callback_data: 'sell_50' },
            { text: 'Sell 75%', callback_data: 'sell_75' },
            { text: 'Sell 100%', callback_data: 'sell_100' }
          ],
          [
            { text: 'Refresh PNL', callback_data: 'refresh_pnl' }
          ]
        ]
      }
    });
  } catch (error) {
    console.error('Error:', error.message);
    bot.sendMessage(msg.chat.id, '❌ Sorry, there was an error processing your request.');
  }
});

// Add this handler after the buy command
bot.onText(/\/sell (.+)/, async (msg, match) => {
  try {
    const chatId = msg.chat.id;
    const params = match[1].split(' '); // Split parameters by space
    
    // Check if parameters are provided
    if (!params || params.length < 2) {
      return bot.sendMessage(chatId, `❌ Invalid format. Please use:
/sell <amount> <token>

Example: /sell 1000 PEPE`);
    }

    const amount = params[0];
    const token = params[1];
    const marketPrice = params[2];
    const tokenAmount = params[3];
    const contractAddress = params[4];

    const message = `🔴 New Sell Order Confirmed:

📛Token: \`${token}\`
🔖CA: \`${contractAddress}\`
💲Amount: \`${tokenAmount}\` \`${token}\` ⇄ \`${amount}\` SOL 
💰Market Cap: \`$${marketPrice}\`


💳Selling Wallet: \`test\`

[View Transaction](https://etherscan.io/tx/0x123)
`;

    bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });
  } catch (error) {
    console.error('Error:', error.message);
    bot.sendMessage(msg.chat.id, '❌ Sorry, there was an error processing your request.');
  }
});

// Error handling
bot.on('polling_error', (error) => {
  console.log(error);
});

console.log('Cipher Trading Bot is running...'); 