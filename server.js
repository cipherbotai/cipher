const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const cors = require('cors');
const server = http.createServer();
const wss = new WebSocket.Server({ server });
const app = express();
const port = 3009; // Different from WebSocket port
const TelegramBot = require('node-telegram-bot-api');

// Store clients by contract address
const rooms = new Map();
// Store message history for each contract (max 15 messages)
const messageHistory = new Map();

// Enable CORS for all routes
app.use(cors({
  origin: ['https://photon-sol.tinyastro.io', 'http://localhost:3000', 'https://photon-sol.tinyastro.io/*', "https://neo.bullx.io/*", "https://legacy.bullx.io/*", "https://backup.bullx.io/*", "https://backup2.bullx.io/*"],
  methods: ['GET', 'POST'],
  credentials: true
}));

// Middleware to parse JSON bodies
app.use(express.json());

// Add this line to serve static files from the 'public' directory
app.use(express.static('public'));

// Initialize the bot
const token = '7691563917:AAEIlZt5HNaYWjJu2mSJjVQ33OPvuliFWMM';
const bot = new TelegramBot(token, { polling: false });
let latestMarketPrice = 0;
let latestTokenAmount = 0;
// Our counter variable
let counter = 0;

// Store chat IDs of users who have started the bot
let chatIds = new Set();

// GET endpoint to retrieve counter value
app.get('/counter', (req, res) => {
  res.json({ value: counter });
});

// POST endpoint to increment counter
app.post('/counter', (req, res) => {
  counter += 1;
  res.json({ value: counter });
});

// New endpoint to handle notifications
app.post('/notify', async (req, res) => {
  try {
    console.log('Received notification request:', req.body);
    const { type, amount, token, marketPrice, tokenAmount, contractAddress } = req.body;
    
    const message = type === 'buy' 
      ? `🟢 New Buy Order Confirmed:

📛Token: \`${token}\`
🔖CA: \`${contractAddress}\`
💲Amount: \`${amount}\` SOL ⇄ \`${tokenAmount}\` \`${token}\`
💰Market Cap: \`$${marketPrice}\`

[View Transaction](https://etherscan.io/tx/0x123)`
      : `🔴 New Sell Order Confirmed:

📛Token: \`${token}\`
🔖CA: \`${contractAddress}\`
💲Amount: \`${tokenAmount}\` \`${token}\` ⇄ \`${amount}\` SOL
💰Market Cap: \`$${marketPrice}\`

[View Transaction](https://etherscan.io/tx/0x123)`;

    console.log('Sending message to Telegram:', message);
    console.log('Active chat IDs:', chatIds);

    // Send to all registered users
    for (const chatId of chatIds) {
      console.log('Sending to chat ID:', chatId);
      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });
      console.log('Message sent successfully to:', chatId);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Failed to send notification', details: error.message });
  }
});

// Add this endpoint to your server
app.post('/buy', async (req, res) => {
  try {
    console.log('Received buy request:', req.body);
    const { amount, token, marketPrice, tokenAmount, contractAddress } = req.body;
    const message = `🟢 New Buy Order Confirmed:

📛Token: \`${token}\`
🔖CA: \`${contractAddress}\`
💲Amount: \`${amount}\` SOL ⇄ \`${tokenAmount}\`
💰Market Cap: \`$${marketPrice}\`

💳Buying Wallet: \`Main Wallet\`

[View Transaction](https://etherscan.io/tx/0x123)
`;
latestMarketPrice = marketPrice;
latestTokenAmount = tokenAmount;
    await bot.sendMessage(2081876066, message, {
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

    console.log('Message sent successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('Error in /buy endpoint:', error);
    res.status(500).json({ error: 'Failed to send buy message', details: error.message });
  }
});

// Add this endpoint alongside /buy
app.post('/sell', async (req, res) => {
  try {
    console.log('Received buy request:', req.body);
    let { amount, token, marketPrice, tokenAmount, contractAddress } = req.body;
    
    // Then update the PNL calculation
    const numericMarketPrice = parseFormattedNumber(marketPrice);
    const numericLatestMarketPrice = parseFormattedNumber(latestMarketPrice);

    const pnl = ((numericMarketPrice - numericLatestMarketPrice) / numericLatestMarketPrice * 100).toFixed(2); 
    amount = 0.5 + (0.5* pnl/100);
    const message = `🔴 New Sell Order Confirmed:

📛Token: \`${token}\`
🔖CA: \`${contractAddress}\`
💲Amount: \`${latestTokenAmount}\` \`${token}\` ⇄ \`${amount}\` SOL 
📈PNL: ${(0.5 * pnl/100).toFixed(2)} (${pnl}%)
💰Market Cap: \`$${marketPrice}\`



💳Selling Wallet: \`Main Wallet\`

[View Transaction](https://etherscan.io/tx/0x123)
`;
    await bot.sendMessage(2081876066, message, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });

    console.log('Message sent successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('Error in /buy endpoint:', error);
    res.status(500).json({ error: 'Failed to send buy message', details: error.message });
  }
});

// Add logging to /start command in bot
bot.onText(/\/start/, async (msg) => {
  try {
    console.log('New /start command from chat ID:', msg.chat.id);
    chatIds.add(msg.chat.id);
    console.log('Updated chat IDs:', chatIds);
    // ... rest of the start command code ...
  } catch (error) {
    console.error('Error in /start command:', error);
  }
});

wss.on('connection', (ws) => {
  let clientRoom = null;

  ws.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      
      if (parsedMessage.type === 'join') {
        // Handle room joining
        const contractAddress = parsedMessage.contractAddress;
        clientRoom = contractAddress;
        
        if (!rooms.has(contractAddress)) {
          rooms.set(contractAddress, new Set());
        }
        rooms.get(contractAddress).add(ws);
        
        console.log(`Client joined room: ${contractAddress}`);

        // Send message history if requested
        if (parsedMessage.requestHistory) {
          const history = messageHistory.get(contractAddress) || [];
          ws.send(JSON.stringify({
            type: 'history',
            messages: history
          }));
        }
        return;
      }

      // Handle chat messages
      if (parsedMessage.type === 'message' && clientRoom) {
        const room = rooms.get(parsedMessage.contractAddress);
        if (!room) return;

        // Store message in history
        if (!messageHistory.has(clientRoom)) {
          messageHistory.set(clientRoom, []);
        }
        const history = messageHistory.get(clientRoom);
        history.push({
          username: parsedMessage.username,
          content: parsedMessage.content,
          timestamp: parsedMessage.timestamp,
          contractAddress: parsedMessage.contractAddress
        });
        // Keep only last 15 messages
        if (history.length > 15) {
          messageHistory.set(clientRoom, history.slice(-15));
        }

        // Broadcast to specific room only
        room.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'message',
              content: parsedMessage.content,
              username: parsedMessage.username,
              timestamp: new Date().toISOString(),
              contractAddress: parsedMessage.contractAddress,
              isSelf: client === ws
            }));
          }
        });
      }
    } catch (error) {
      console.error('Message handling error:', error);
    }
  });

  ws.on('close', () => {
    // Remove client from their room when they disconnect
    if (clientRoom && rooms.has(clientRoom)) {
      rooms.get(clientRoom).delete(ws);
      
      // Clean up empty rooms
      if (rooms.get(clientRoom).size === 0) {
        rooms.delete(clientRoom);
        // Keep message history even when room is empty
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Add this helper function
function parseFormattedNumber(formattedNum) {
  if (typeof formattedNum !== 'string') return Number(formattedNum);
  
  const multiplier = {
    'K': 1000,
    'M': 1000000,
    'B': 1000000000
  };

  // Remove any commas
  formattedNum = formattedNum.replace(/,/g, '');
  
  // Extract number and suffix
  const match = formattedNum.match(/^([\d.]+)([KMB])?$/i);
  if (!match) return Number(formattedNum);

  const [, num, suffix] = match;
  const numericValue = Number(num);
  
  return suffix ? numericValue * multiplier[suffix.toUpperCase()] : numericValue;
}

// Add this endpoint after the CORS setup (around line 21)
app.get('/privacy-policy', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Privacy Policy - Cipher Bot</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #EDEDED;
                background: linear-gradient(145deg, #1F1F1D, #121212);
                margin: 0;
                padding: 20px;
                min-height: 100vh;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
                padding: 40px 20px;
                background: rgba(18, 18, 18, 0.85);
                border-radius: 12px;
                border: 1px solid rgba(166, 122, 27, 0.3);
                backdrop-filter: blur(12px);
                box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
            }
            h1 {
                color: #A67A1B;
                text-align: center;
                margin-bottom: 40px;
            }
            h2 {
                color: #A67A1B;
                margin-top: 30px;
            }
            p {
                margin-bottom: 20px;
            }
            ul {
                padding-left: 20px;
            }
            li {
                margin-bottom: 10px;
            }
            .last-updated {
                text-align: center;
                margin-top: 40px;
                color: #666;
                font-size: 0.9em;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Privacy Policy</h1>
            
            <h2>Information Collection and Use</h2>
            <p>We collect minimal information necessary for the functioning of our chat service:</p>
            <ul>
                <li>Username (chosen by you)</li>
                <li>Chat messages</li>
                <li>Contract addresses you interact with</li>
            </ul>

            <h2>Data Storage</h2>
            <p>We store chat history temporarily (maximum 15 messages per contract) to provide a seamless chat experience. Messages are automatically deleted as new messages come in.</p>

            <h2>Data Sharing</h2>
            <p>We do not share your personal information with third parties. Chat messages are only visible to other users in the same contract-specific chat room.</p>

            <h2>Security</h2>
            <p>While we implement reasonable security measures, please be aware that no method of transmission over the internet is 100% secure.</p>

            <h2>Your Rights</h2>
            <p>You can choose your username and control what messages you send. Chat history is automatically managed and limited to recent messages only.</p>

            <h2>Contact</h2>
            <p>For any questions about this Privacy Policy, please contact us at support@cipherbot.tech</p>

            <div class="last-updated">Last updated: ${new Date().toLocaleDateString()}</div>
        </div>
    </body>
    </html>
  `;

  res.send(html);
});

// Add this endpoint for the form page
app.get('/apply', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Apply - Cipher Bot</title>
        <link rel="icon" type="image/x-icon" href="/favicon.ico">
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #EDEDED;
                background: linear-gradient(145deg, #1F1F1D, #121212);
                margin: 0;
                padding: 20px;
                min-height: 100vh;
            }
            .container {
                max-width: 500px;
                margin: auto;
                padding: 40px 20px;
                background: rgba(18, 18, 18, 0.85);
                border-radius: 12px;
                border: 1px solid rgba(166, 122, 27, 0.3);
                backdrop-filter: blur(12px);
                box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
            }
            h1 {
                color: #A67A1B;
                text-align: center;
                margin-bottom: 40px;
            }
            .form-group {
                margin-bottom: 20px;
            }
            label {
                display: block;
                margin-bottom: 8px;
                color: #A67A1B;
            }
            input {
                width: 100%;
                padding: 12px;
                background: #1F1F1D;
                border: 1px solid rgba(166, 122, 27, 0.3);
                border-radius: 8px;
                color: #EDEDED;
                font-size: 16px;
                box-sizing: border-box;
            }
            input:focus {
                outline: none;
                border-color: #A67A1B;
                box-shadow: 0 0 0 2px rgba(166, 122, 27, 0.2);
            }
            button {
                width: 100%;
                padding: 14px;
                background: #A67A1B;
                border: none;
                border-radius: 8px;
                color: #EDEDED;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: background-color 0.2s ease;
            }
            button:hover {
                background: #8B6516;
            }
            button:disabled {
                background: #5C4210;
                cursor: not-allowed;
            }
            .success-message {
                display: none;
                text-align: center;
                color: #4CAF50;
                margin-top: 20px;
                padding: 10px;
                border-radius: 8px;
                background: rgba(76, 175, 80, 0.1);
            }
            .header {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                padding: 20px;
                background: rgba(18, 18, 18, 0.95);
                backdrop-filter: blur(12px);
                border-bottom: 1px solid rgba(166, 122, 27, 0.3);
                display: flex;
                justify-content: space-between;
                align-items: center;
                z-index: 1000;
            }

            .logo-container {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .logo {
                height: 40px;
                width: auto;
            }

            .nav-links {
                display: flex;
                gap: 24px;
            }

            .nav-link {
                color: #EDEDED;
                text-decoration: none;
                font-size: 16px;
                display: flex;
                align-items: center;
                gap: 6px;
                transition: color 0.2s ease;
            }

            .nav-link:hover {
                color: #A67A1B;
            }

            .nav-link img {
                height: 16px;
                width: 16px;
            }

            /* Adjust body padding to account for fixed header */
            body {
                padding-top: 100px;
            }
        </style>
    </head>
    <body>
        <header class="header">
            <div class="logo-container">
                <img src="/icon-dark-128.png" alt="Cipher Bot Logo" class="logo">
            </div>
            <nav class="nav-links">
                <a href="https://twitter.com/CipherBot" target="_blank" class="nav-link">
                    <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMyAzYTEwLjkgMTAuOSAwIDAgMS0zLjE0IDEuNTMgNC40OCA0LjQ4IDAgMCAwLTcuODYgM3YxQTEwLjY2IDEwLjY2IDAgMCAxIDMgNHMtNCA5IDUgMTNhMTEuNjQgMTEuNjQgMCAwIDEtNyAyYzkgNSAyMCAwIDIwLTExLjVhNC41IDQuNSAwIDAgMC0uMDgtLjgzQTcuNzIgNy43MiAwIDAgMCAyMyAzeiI+PC9wYXRoPjwvc3ZnPg==" alt="Twitter">
                    Twitter
                </a>
                <a href="https://cipherbot.tech" target="_blank" class="nav-link">
                    <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIj48L2NpcmNsZT48bGluZSB4MT0iMiIgeTE9IjEyIiB4Mj0iMjIiIHkyPSIxMiI+PC9saW5lPjxwYXRoIGQ9Ik0xMiAyYTE1LjMgMTUuMyAwIDAgMSA0IDEwIDE1LjMgMTUuMyAwIDAgMS00IDEwIDE1LjMgMTUuMyAwIDAgMS00LTEwIDE1LjMgMTUuMyAwIDAgMSA0LTEweiI+PC9wYXRoPjwvc3ZnPg==" alt="Website">
                    Website
                </a>
            </nav>
        </header>

        <div style="
            text-align: center;
            color: #A67A1B;
            margin: 80px auto 20px auto;
            max-width: 500px;
            font-size: 14px;
            background: rgba(166, 122, 27, 0.1);
            padding: 12px;
            border-radius: 8px;
            border: 1px solid rgba(166, 122, 27, 0.2);
        ">
            ⚠️ Please note: Duplicate entries will be automatically eliminated
        </div>

        <div class="container">
            <h1>Apply for Access</h1>
            <form id="applicationForm">
                <div class="form-group">
                    <label for="twitter">Twitter Handle</label>
                    <input type="text" id="twitter" name="twitter" required placeholder="@username">
                </div>
                <div class="form-group">
                    <label for="telegram">Telegram Handle</label>
                    <input type="text" id="telegram" name="telegram" required placeholder="@username">
                </div>
                <div class="form-group">
                    <label for="wallet">Wallet Address</label>
                    <input type="text" id="wallet" name="wallet" required placeholder="Your wallet address">
                </div>
                <button type="submit" id="submitButton">Submit Application</button>
                <div id="successMessage" class="success-message">
                    Application submitted successfully!
                </div>
            </form>
        </div>

        <script>
            const form = document.getElementById('applicationForm');
            const submitButton = document.getElementById('submitButton');
            const successMessage = document.getElementById('successMessage');

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                submitButton.disabled = true;
                submitButton.textContent = 'Processing...';

                const formData = {
                    twitter: document.getElementById('twitter').value,
                    telegram: document.getElementById('telegram').value,
                    wallet: document.getElementById('wallet').value
                };

                try {
                    // Add artificial delay of 3 seconds before making the API call
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    submitButton.textContent = 'Sending...';

                    const response = await fetch('/submit-application', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(formData)
                    });

                    const result = await response.json();
                    
                    if (result.success) {
                        // Add artificial delay of 1.5 seconds
                        await new Promise(resolve => setTimeout(resolve, 1500));
                        successMessage.style.display = 'block';
                        form.reset();
                    }
                } catch (error) {
                    console.error('Error:', error);
                } finally {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Submit Application';
                }
            });
        </script>
    </body>
    </html>
  `;

  res.send(html);
});

// Add this endpoint for form submission
app.post('/submit-application', (req, res) => {
  // Always return success
  res.json({ success: true });
});


