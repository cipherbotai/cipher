document.addEventListener('DOMContentLoaded', function() {
    // First, check if extension is already injected
    const existingContainer = document.querySelector('.cipher-container');
    if (existingContainer) return;

    // Force enable the extension
    chrome.storage.local.get(['is_cipher_extension_on'], function(result) {
        // Always set isEnabled to true since we want it enabled by default
        const isEnabled = true;
        
        const app = document.createElement('div');
        app.innerHTML = `
            <div class="cipher-container">
                <div class="background-shapes">
                    <div class="shape circle"></div>
                    <div class="shape hexagon"></div>
                    <div class="shape square"></div>
                    <div class="shape circle-2"></div>
                    <div class="shape hexagon-2"></div>
                </div>
                <div class="content">
                    <img src="assets/cipher-logo.png" alt="Cipher Logo" class="logo">
                    <h1>Cipher Bot</h1>
                    <div class="stats">
                        <div class="stat-item">
                            <span class="stat-label">Version</span>
                            <span class="stat-value">1.0.0-beta</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Status</span>
                            <span class="stat-value status-active">Active</span>
                        </div>
                    </div>
                    <div class="actions">
                        <div class="status-indicator enabled">
                            <span class="btn-icon">✓</span>
                            <span>Enabled</span>
                        </div>
                        <button class="action-btn secondary" id="telegramBtn">
                            <span class="btn-icon">📱</span>
                            Login to Telegram
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Update the click handler for the Telegram button
        app.querySelector('#telegramBtn').addEventListener('click', () => {
            window.open('https://t.me/ciphertrading_bot', '_blank');
        });

        document.body.appendChild(app);
    });

    const styles = document.createElement('style');
    styles.textContent = `
        body {
            margin: 0;
            padding: 0;
            width: 350px;
            height: 400px;
            font-family: 'Mulish', sans-serif;
            background: #121212;
        }

        .cipher-container {
            position: relative;
            width: 100%;
            height: 100%;
            background: linear-gradient(145deg, #1F1F1D, #121212);
            overflow: hidden;
            box-shadow: inset 0 0 100px rgba(166, 122, 27, 0.1);
        }

        .background-shapes {
            position: absolute;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }

        .shape {
            position: absolute;
            opacity: 0.1;
            background: linear-gradient(145deg, #A67A1B, #8B6516);
            filter: blur(1px);
        }

        .circle, .circle-2 {
            width: 120px;
            height: 120px;
            border-radius: 50%;
        }

        .circle {
            top: 10%;
            left: -30px;
            animation: float 8s infinite ease-in-out;
        }

        .circle-2 {
            bottom: 20%;
            right: -30px;
            animation: float 8s infinite ease-in-out reverse;
        }

        .hexagon, .hexagon-2 {
            width: 80px;
            height: 90px;
            clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
        }

        .hexagon {
            top: 70%;
            left: 15%;
            animation: spin 12s infinite linear;
        }

        .hexagon-2 {
            top: 20%;
            right: 15%;
            animation: spin 12s infinite linear reverse;
        }

        .content {
            position: relative;
            z-index: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            height: 100%;
            padding: 40px 20px;
            box-sizing: border-box;
        }

        .logo {
            width: 100px;
            height: 100px;
            margin-bottom: 20px;
            animation: glow 3s infinite alternate;
            filter: drop-shadow(0 0 10px rgba(166, 122, 27, 0.3));
        }

        h1 {
            color: #EDEDED;
            font-size: 28px;
            margin: 0 0 30px 0;
            text-align: center;
            font-weight: 800;
            background: linear-gradient(to right, #A67A1B, #C49322);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .stats {
            display: flex;
            gap: 20px;
            margin-bottom: 30px;
            width: 100%;
            justify-content: center;
        }

        .stat-item {
            background: rgba(166, 122, 27, 0.1);
            padding: 10px 20px;
            border-radius: 12px;
            border: 1px solid rgba(166, 122, 27, 0.2);
            text-align: center;
        }

        .stat-label {
            display: block;
            color: #A67A1B;
            font-size: 12px;
            margin-bottom: 4px;
        }

        .stat-value {
            display: block;
            color: #EDEDED;
            font-size: 14px;
            font-weight: 600;
        }

        .status-active {
            color: #4CAF50;
        }

        .actions {
            display: flex;
            flex-direction: column;
            gap: 10px;
            width: 100%;
            max-width: 250px;
        }

        .action-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 12px;
            border: none;
            border-radius: 12px;
            background: linear-gradient(145deg, #A67A1B, #8B6516);
            color: white;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: 'Mulish', sans-serif;
        }

        .action-btn.secondary {
            background: transparent;
            border: 1px solid #A67A1B;
        }

        .action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(166, 122, 27, 0.3);
        }

        .btn-icon {
            font-size: 16px;
        }

        @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
        }

        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        @keyframes glow {
            from { filter: drop-shadow(0 0 2px rgba(166, 122, 27, 0.5)); }
            to { filter: drop-shadow(0 0 15px rgba(166, 122, 27, 0.8)); }
        }

        .action-btn.enabled {
            background: linear-gradient(145deg, #4CAF50, #45a049);
            border: none;
        }

        .action-btn.enabled:hover {
            background: linear-gradient(145deg, #45a049, #4CAF50);
        }

        .status-indicator {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 12px;
            border-radius: 12px;
            color: white;
            font-weight: 600;
            font-family: 'Mulish', sans-serif;
            background: linear-gradient(145deg, #4CAF50, #45a049);
            margin-bottom: 10px;
        }

        .status-indicator.enabled {
            background: linear-gradient(145deg, #4CAF50, #45a049);
        }
    `;

    document.head.appendChild(styles);
});
