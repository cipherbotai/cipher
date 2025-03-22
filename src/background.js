const getElementsClassname = async () => {
  console.log("Get Elements Classname Triggered ✨");
  try {
    const response = await fetch("https://api.tradeoncipher.io/api-v1/elements", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get elements classname: ", response);
    }

    let result = await response.json();

    result = processUnicodeEscapes(result);

    if (result) {
      console.log("Success to get elements classname ✅: ", result);
      chrome.storage.local.set(
        {
          elements_classname: result,
          is_buy_photon: true,
          is_buy_bullx: true,
          is_buy_legacybullx: true,
          is_buy_neobullx: true,
          is_buy_neobackupbullx: true,
          is_buy_gmgn: true,
          is_buy_axiom: true,
          is_buy_pumpfun: true,
          discord_state: {
            buy_history: [],
            windows: [],
          },
          telegram_state: {
            buy_history: [],
            windows: [],
          },
          show_flying_modal: false,
          show_flying_modal: true,
          flying_modal_position: {
            top: 50,
            left: 100,
          },
          custom_buy_value_list: [0.5, 1, 2, 5, 10],
          custom_sell_value_list: [10, 25, 50, 100],
          default_buy_amount: 0.01,
          active_preset_label: "S1",
          active_preset_values: {
            "buy-fee": 0.001,
            "buy-tip": 0.005,
            "buy-slippage": 50,
            "sell-fee": 0.001,
            "sell-tip": 0.005,
            "sell-slippage": 50,
          },
          first_preset_values: {
            "buy-fee": 0.001,
            "buy-tip": 0.005,
            "buy-slippage": 50,
            "sell-fee": 0.001,
            "sell-tip": 0.005,
            "sell-slippage": 50,
          },
          second_preset_values: {
            "buy-fee": 0.005,
            "buy-tip": 0.01,
            "buy-slippage": 60,
            "sell-fee": 0.005,
            "sell-tip": 0.01,
            "sell-slippage": 60,
          },
          // AI Trading default settings
          ai_trading_enabled: false,
          ai_trading_settings: {
            autoBuyEnabled: false,
            autoSellEnabled: false,
            confidenceThreshold: 0.75,
            maxInvestmentAmount: 0.1,
            stopLossPercentage: 0.05,
            takeProfitPercentage: 0.15,
            trailingStopEnabled: false,
            trailingStopDistance: 0.03,
            tradingHourRestriction: false,
            tradingHoursStart: 0,  // 24h format
            tradingHoursEnd: 24,   // 24h format
            riskLevel: "medium",   // low, medium, high
            recentTradesLimit: 3,  // max number of trades per day
            minimumLiquidityRequired: 500, // minimum liquidity in SOL
          },
          // Limit Orders default settings
          limit_orders_enabled: true,
          limit_order_notifications: true,
          // Portfolio Management default settings
          portfolio_management_enabled: true,
          portfolio_settings: {
            riskLevel: "MEDIUM",
            defaultStopLossPercentage: 0.05,
            defaultTakeProfitPercentage: 0.15,
            trailingStopEnabled: true,
            trailingStopActivationThreshold: 0.7, // Activate at 70% of take profit
            trailingStopDistance: 0.05,
            dcaEnabled: false,
            rebalancingEnabled: false,
            rebalancingFrequency: 7, // days
            maxAllocationPerAsset: 0.2 // 20% max in one asset
          }
        },
        () => {},
      );
    }
  } catch (error) {
    console.error("Error get elements classname: ", error);
  }
};

const processUnicodeEscapes = (obj) => {
  if (typeof obj !== "object" || obj === null) return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      if (typeof value === "string") {
        return [
          key,
          value.replace(/\\u([0-9a-fA-F]{4})/g, (match, code) =>
            String.fromCharCode(parseInt(code, 16)),
          ),
        ];
      }
      if (typeof value === "object") {
        return [key, processUnicodeEscapes(value)];
      }
      return [key, value];
    }),
  );
};

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    console.log("Cipher Extension Initialization 🚩");
    chrome.storage.local.clear(() => {
      chrome.storage.local.set({
        'is_cipher_extension_on': true,
        'cipher_auth_token': true
      }, () => {
        getElementsClassname();
      });
    });
  }
  if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
    getElementsClassname();
  }
});

chrome.tabs.onActivated.addListener(async (activatedInfo) => {
  const windowId = await getWindowId();
  if (!activatedInfo.tabId) return;
  chrome.tabs
    .sendMessage(activatedInfo?.tabId, { context: "Trigger base.js", windowId })
    .then(() => {})
    .catch((err) => {});
  chrome.tabs.get(activatedInfo.tabId, (tab) => {
    const message = getMessage(tab?.url);
    if (message) {
      chrome.tabs
        .sendMessage(activatedInfo.tabId, { message, windowId })
        .then(() => {})
        .catch((err) => {});
    }
  });
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.context === "Cipher Auth Token Found 🪙") {
    chrome.storage.local.set(
      {
        cipher_auth_token: request.token,
      },
      () => {},
    );
  }
  
  // AI Trading message handlers
  else if (request.context === "get_ai_prediction") {
    if (!request.tokenMint) {
      sendResponse({ success: false, error: "No token mint address provided" });
      return;
    }
    
    // Dynamically import the AI trading module
    import(chrome.runtime.getURL('src/ai-trading.js'))
      .then(module => {
        // Generate a trading signal
        module.cipherAITrading.generateTradingSignal(request.tokenMint)
          .then(signal => {
            sendResponse({ success: true, signal });
          })
          .catch(error => {
            sendResponse({ success: false, error: error.message });
          });
      })
      .catch(error => {
        sendResponse({ success: false, error: "Failed to load AI trading module" });
      });
    
    return true; // Indicates async response
  }
  
  else if (request.context === "execute_ai_trade") {
    if (!request.tokenMint) {
      sendResponse({ success: false, error: "No token mint address provided" });
      return;
    }
    
    // Dynamically import the AI trading module
    import(chrome.runtime.getURL('src/ai-trading.js'))
      .then(module => {
        // Execute AI-based trade
        module.cipherAITrading.executeAITrade(request.tokenMint, request.config)
          .then(result => {
            sendResponse({ success: true, result });
          })
          .catch(error => {
            sendResponse({ success: false, error: error.message });
          });
      })
      .catch(error => {
        sendResponse({ success: false, error: "Failed to load AI trading module" });
      });
    
    return true; // Indicates async response
  }
  
  // Limit Orders message handlers
  else if (request.context === "create_limit_order") {
    if (!request.orderData || !request.orderData.tokenMint) {
      sendResponse({ success: false, error: "Invalid order data" });
      return;
    }
    
    // Dynamically import the limit orders module
    import(chrome.runtime.getURL('src/limit-orders.js'))
      .then(module => {
        // Create a new limit order
        module.cipherLimitOrders.createLimitOrder(request.orderData)
          .then(order => {
            sendResponse({ success: true, order });
          })
          .catch(error => {
            sendResponse({ success: false, error: error.message });
          });
      })
      .catch(error => {
        sendResponse({ success: false, error: "Failed to load limit orders module" });
      });
    
    return true; // Indicates async response
  }
  
  else if (request.context === "get_limit_orders") {
    // Dynamically import the limit orders module
    import(chrome.runtime.getURL('src/limit-orders.js'))
      .then(module => {
        // Get token-specific or all active limit orders
        if (request.tokenMint) {
          module.cipherLimitOrders.getTokenLimitOrders(request.tokenMint)
            .then(orders => {
              sendResponse({ success: true, orders });
            })
            .catch(error => {
              sendResponse({ success: false, error: error.message });
            });
        } else {
          module.cipherLimitOrders.getActiveLimitOrders()
            .then(orders => {
              sendResponse({ success: true, orders });
            })
            .catch(error => {
              sendResponse({ success: false, error: error.message });
            });
        }
      })
      .catch(error => {
        sendResponse({ success: false, error: "Failed to load limit orders module" });
      });
    
    return true; // Indicates async response
  }
  
  else if (request.context === "update_limit_order") {
    if (!request.orderId || !request.updatedData) {
      sendResponse({ success: false, error: "Invalid update data" });
      return;
    }
    
    // Dynamically import the limit orders module
    import(chrome.runtime.getURL('src/limit-orders.js'))
      .then(module => {
        // Update an existing limit order
        module.cipherLimitOrders.updateLimitOrder(request.orderId, request.updatedData)
          .then(order => {
            sendResponse({ success: true, order });
          })
          .catch(error => {
            sendResponse({ success: false, error: error.message });
          });
      })
      .catch(error => {
        sendResponse({ success: false, error: "Failed to load limit orders module" });
      });
    
    return true; // Indicates async response
  }
  
  else if (request.context === "cancel_limit_order") {
    if (!request.orderId) {
      sendResponse({ success: false, error: "No order ID provided" });
      return;
    }
    
    // Dynamically import the limit orders module
    import(chrome.runtime.getURL('src/limit-orders.js'))
      .then(module => {
        // Cancel a limit order
        module.cipherLimitOrders.cancelLimitOrder(request.orderId)
          .then(order => {
            sendResponse({ success: true, order });
          })
          .catch(error => {
            sendResponse({ success: false, error: error.message });
          });
      })
      .catch(error => {
        sendResponse({ success: false, error: "Failed to load limit orders module" });
      });
    
    return true; // Indicates async response
  }
  
  else if (request.context === "get_token_price") {
    if (!request.tokenMint) {
      sendResponse({ success: false, error: "No token mint address provided" });
      return;
    }
    
    // Dynamically import the limit orders module (which has price fetching functionality)
    import(chrome.runtime.getURL('src/limit-orders.js'))
      .then(module => {
        // Fetch current token price
        module.cipherLimitOrders.fetchTokenPrice(request.tokenMint)
          .then(price => {
            sendResponse({ success: true, price });
          })
          .catch(error => {
            sendResponse({ success: false, error: error.message });
          });
      })
      .catch(error => {
        sendResponse({ success: false, error: "Failed to load limit orders module" });
      });
    
    return true; // Indicates async response
  }
  
  // Portfolio Management message handlers
  else if (request.context === "initialize_portfolio") {
    // Dynamically import the portfolio manager module
    import(chrome.runtime.getURL('src/portfolio-manager.js'))
      .then(module => {
        // Initialize portfolio with base balance
        module.cipherPortfolioManager.initializePortfolio(request.baseBalance)
          .then(portfolio => {
            sendResponse({ success: true, portfolio });
          })
          .catch(error => {
            sendResponse({ success: false, error: error.message });
          });
      })
      .catch(error => {
        sendResponse({ success: false, error: "Failed to load portfolio manager module" });
      });
    
    return true; // Indicates async response
  }
  
  else if (request.context === "get_portfolio_summary") {
    // Dynamically import the portfolio manager module
    import(chrome.runtime.getURL('src/portfolio-manager.js'))
      .then(module => {
        // Get portfolio summary
        module.cipherPortfolioManager.getPortfolioSummary()
          .then(summary => {
            sendResponse({ success: true, summary });
          })
          .catch(error => {
            sendResponse({ success: false, error: error.message });
          });
      })
      .catch(error => {
        sendResponse({ success: false, error: "Failed to load portfolio manager module" });
      });
    
    return true; // Indicates async response
  }
  
  else if (request.context === "add_position") {
    if (!request.positionData) {
      sendResponse({ success: false, error: "No position data provided" });
      return;
    }
    
    // Dynamically import the portfolio manager module
    import(chrome.runtime.getURL('src/portfolio-manager.js'))
      .then(module => {
        // Add a new position
        module.cipherPortfolioManager.addPosition(request.positionData)
          .then(position => {
            sendResponse({ success: true, position });
          })
          .catch(error => {
            sendResponse({ success: false, error: error.message });
          });
      })
      .catch(error => {
        sendResponse({ success: false, error: "Failed to load portfolio manager module" });
      });
    
    return true; // Indicates async response
  }
  
  else if (request.context === "close_position") {
    if (!request.tokenAddress || !request.exitPrice) {
      sendResponse({ success: false, error: "Missing required position data" });
      return;
    }
    
    // Dynamically import the portfolio manager module
    import(chrome.runtime.getURL('src/portfolio-manager.js'))
      .then(module => {
        // Close a position
        module.cipherPortfolioManager.closePosition(request.tokenAddress, request.exitPrice, request.amount)
          .then(result => {
            sendResponse({ success: true, result });
          })
          .catch(error => {
            sendResponse({ success: false, error: error.message });
          });
      })
      .catch(error => {
        sendResponse({ success: false, error: "Failed to load portfolio manager module" });
      });
    
    return true; // Indicates async response
  }
  
  else if (request.context === "update_position_prices") {
    // Dynamically import the portfolio manager module
    import(chrome.runtime.getURL('src/portfolio-manager.js'))
      .then(module => {
        // Update position prices and check for stop loss/take profit
        module.cipherPortfolioManager.updatePositionPrices()
          .then(executedOrders => {
            sendResponse({ success: true, executedOrders });
          })
          .catch(error => {
            sendResponse({ success: false, error: error.message });
          });
      })
      .catch(error => {
        sendResponse({ success: false, error: "Failed to load portfolio manager module" });
      });
    
    return true; // Indicates async response
  }
  
  else if (request.context === "execute_dca_strategy") {
    if (!request.config) {
      sendResponse({ success: false, error: "No DCA configuration provided" });
      return;
    }
    
    // Dynamically import the portfolio manager module
    import(chrome.runtime.getURL('src/portfolio-manager.js'))
      .then(module => {
        // Setup DCA strategy
        module.cipherPortfolioManager.executeDCAStrategy(request.config)
          .then(strategy => {
            sendResponse({ success: true, strategy });
          })
          .catch(error => {
            sendResponse({ success: false, error: error.message });
          });
      })
      .catch(error => {
        sendResponse({ success: false, error: "Failed to load portfolio manager module" });
      });
    
    return true; // Indicates async response
  }
  
  else if (request.context === "execute_grid_strategy") {
    if (!request.config) {
      sendResponse({ success: false, error: "No grid strategy configuration provided" });
      return;
    }
    
    // Dynamically import the portfolio manager module
    import(chrome.runtime.getURL('src/portfolio-manager.js'))
      .then(module => {
        // Setup grid trading strategy
        module.cipherPortfolioManager.executeGridStrategy(request.config)
          .then(result => {
            sendResponse({ success: true, result });
          })
          .catch(error => {
            sendResponse({ success: false, error: error.message });
          });
      })
      .catch(error => {
        sendResponse({ success: false, error: "Failed to load portfolio manager module" });
      });
    
    return true; // Indicates async response
  }
});

const getWindowId = async () => {
  return (await chrome.windows.getCurrent()).id;
};

const getMessage = (url) => {
  try {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname;
    if (url.includes("twitter.com") || url.includes("x.com")) {
      return "twitter-content";
    } else if (url.startsWith("https://photon-sol.tinyastro.io/")) {
      if (pathname.startsWith("/en/lp/") || pathname.startsWith("/zn/lp/")) {
        return "photon-token";
      } else {
        chrome.storage.local.set(
          {
            is_buy_photon: true,
          },
          () => {
            console.log("Success to reset buy status on photon ✅");
          },
        );
      }
      if (
        pathname.startsWith("/en/memescope") ||
        pathname.startsWith("/zh/memescope")
      )
        return "photon-memescope";
    } else if (
      [
        "https://bullx.io/",
        "https://backup.bullx.io/",
        "https://backup2.bullx.io/",
      ].some((mappedUrl) => url.startsWith(mappedUrl))
    ) {
      if (pathname.startsWith("/terminal")) {
        return "bullx-token";
      } else {
        chrome.storage.local.set(
          {
            is_buy_bullx: true,
          },
          () => {
            console.log("Success to reset buy status on bullx ✅");
          },
        );
      }
      if (pathname.startsWith("/pump-vision")) return "bullx-pump-vision";
    } else if (url.startsWith("https://neo.bullx.io/")) {
      if (pathname.startsWith("/terminal")) {
        return "neo-bullx-token";
      } else {
        chrome.storage.local.set(
          {
            is_buy_neobullx: true,
          },
          () => {
            console.log("Success to reset buy status on neobullx ✅");
          },
        );
      }
      if (pathname.startsWith("/")) return "neo-bullx-pump-vision";
    } else if (url.startsWith("https://neo-backup.bullx.io/")) {
      if (pathname.startsWith("/terminal")) {
        return "neo-backup-bullx-token";
      } else {
        chrome.storage.local.set(
          {
            is_buy_neobackupbullx: true,
          },
          () => {
            console.log("Success to reset buy status on neobackupbullx ✅");
          },
        );
      }
      if (pathname.startsWith("/")) return "neo-backup-bullx-pump-vision";
    } else if (url.startsWith("https://legacy.bullx.io/")) {
      if (pathname.startsWith("/terminal")) {
        return "legacy-bullx-token";
      } else {
        chrome.storage.local.set(
          {
            is_buy_legacybullx: true,
          },
          () => {
            console.log("Success to reset buy status on legacybullx ✅");
          },
        );
      }
      if (pathname.startsWith("/")) return "legacy-bullx-pump-vision";
    } else if (url.startsWith("https://gmgn.ai/")) {
      if (pathname.startsWith("/sol/token")) {
        return "gmgn-token";
      } else {
        chrome.storage.local.set(
          {
            is_buy_gmgn: true,
          },
          () => {
            console.log("Success to reset buy status on gmgn ✅");
          },
        );
      }
      if (pathname.startsWith("/meme")) return "gmgn-memescope";
    } else if (url.startsWith("https://axiom.trade/")) {
      if (pathname.startsWith("/meme")) {
        return "axiom-token";
      } else {
        chrome.storage.local.set(
          {
            is_buy_axiom: true,
          },
          () => {
            console.log("Success to reset buy status on axiom ✅");
          },
        );
      }
      if (pathname.startsWith("/pulse")) return "axiom-memescope";
    } else if (url.startsWith("https://pump.fun/")) {
      if (pathname.startsWith("/coin")) {
        return "pumpfun-token";
      } else {
        chrome.storage.local.set(
          {
            is_buy_pumpfun: true,
          },
          () => {
            console.log("Success to reset buy status on pumpfun ✅");
          },
        );
      }
      if (pathname.startsWith("/board")) return "pumpfun-memescope";
    } else if (url.startsWith("https://discord.com/")) {
      if (pathname.startsWith("/channels/")) return "discord-chatroom";
    } else if (url.startsWith("https://web.telegram.org/")) {
      if (pathname.startsWith("/a/")) return "telegram-chatroom-a";
      if (pathname.startsWith("/k/")) return "telegram-chatroom-k";
    }
    return;
  } catch (error) {
    console.log("INVALID URL ❌", url, error);
    return;
  }
};
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  const windowId = await getWindowId();
  if (
    changeInfo.url &&
    changeInfo.url.includes("https://web.telegram.org/") &&
    changeInfo.status === "loading"
  ) {
    if (!windowId) return;
    const message = getMessage(changeInfo.url);
    if (message) {
      chrome.tabs
        .sendMessage(tabId, { message, windowId, changeInfo })
        .then(() => {})
        .catch((err) => {});
    }
  }
  if (!changeInfo.url || changeInfo.status !== "complete" || !windowId) return;
  const message = getMessage(changeInfo.url);
  if (message) {
    chrome.tabs
      .sendMessage(tabId, { message, windowId, changeInfo })
      .then(() => {})
      .catch((err) => {});
  }
});

const handleNavigation = async (details, variant) => {
  const windowId = await getWindowId();
  if (!details.url || !windowId) return;

  const message = getMessage(details.url);
  if (message) {
    const maxRetries = 5;
    let attempt = 0;

    const sendMessageWithRetry = () => {
      chrome.tabs
        .sendMessage(details.tabId, { message, windowId })
        .then(() => {})
        .catch((err) => {
          attempt++;
          if (attempt < maxRetries) {
            setTimeout(sendMessageWithRetry, Math.pow(2, attempt) * 100);
          } else {
          }
        });
    };

    sendMessageWithRetry();
  }
};
chrome.webNavigation.onCompleted.addListener((event) =>
  handleNavigation(event, "ON COMPLETED"),
);
chrome.webNavigation.onHistoryStateUpdated.addListener((event) =>
  handleNavigation(event, "ON HISTORY UPDATED"),
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'fetchWaitList') {
    fetch(message.url)
      .then(response => response.json())
      .then(data => {
        sendResponse({ value: data.value });
      })
      .catch(error => {
        console.error('Error:', error);
        sendResponse({ value: '--' });
      });
    return true;
  }
});

// Set up alarm for AI trading regular checks
chrome.alarms.create('aiTradingCheck', { periodInMinutes: 5 });

// Set up alarm for cleaning up expired limit orders
chrome.alarms.create('limitOrdersCleanup', { periodInMinutes: 60 });

// Set up alarm for updating portfolio positions
chrome.alarms.create('portfolioUpdate', { periodInMinutes: 2 });

// Set up alarm for checking DCA strategies
chrome.alarms.create('dcaCheck', { periodInMinutes: 60 });

// Handle alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'aiTradingCheck') {
    // Check for AI trading opportunities
    chrome.storage.local.get('ai_trading_enabled', (data) => {
      if (data.ai_trading_enabled) {
        console.log('Running AI trading check...');
        // This would scan watchlist tokens and execute trades based on AI signals
        // Implementation details depend on the specific AI trading strategy
      }
    });
  }
  
  else if (alarm.name === 'limitOrdersCleanup') {
    // Clean up expired limit orders
    import(chrome.runtime.getURL('src/limit-orders.js'))
      .then(module => {
        module.cipherLimitOrders.checkExpiredOrders()
          .then(() => {
            console.log('Expired limit orders cleanup completed');
          })
          .catch(error => {
            console.error('Error cleaning up expired limit orders:', error);
          });
      })
      .catch(error => {
        console.error('Failed to load limit orders module:', error);
      });
  }
  
  else if (alarm.name === 'portfolioUpdate') {
    // Update portfolio positions
    chrome.storage.local.get('portfolio_management_enabled', (data) => {
      if (data.portfolio_management_enabled) {
        import(chrome.runtime.getURL('src/portfolio-manager.js'))
          .then(module => {
            module.cipherPortfolioManager.updatePositionPrices()
              .then(executedOrders => {
                if (executedOrders.length > 0) {
                  console.log('Portfolio positions updated with executed orders:', executedOrders);
                  
                  // Send notification for executed orders
                  chrome.storage.local.get('limit_order_notifications', (data) => {
                    if (data.limit_order_notifications) {
                      executedOrders.forEach(order => {
                        chrome.notifications.create({
                          type: 'basic',
                          iconUrl: './icon-dark-128.png',
                          title: `${order.type} Executed`,
                          message: `${order.type} executed for ${order.result.tokenAddress} at price ${order.result.exitPrice.toFixed(6)}. PnL: ${order.result.pnl.toFixed(4)} (${(order.result.pnlPercentage * 100).toFixed(2)}%)`,
                          priority: 2
                        });
                      });
                    }
                  });
                } else {
                  console.log('Portfolio positions updated, no orders executed');
                }
              })
              .catch(error => {
                console.error('Error updating portfolio positions:', error);
              });
          })
          .catch(error => {
            console.error('Failed to load portfolio manager module:', error);
          });
      }
    });
  }
  
  else if (alarm.name === 'dcaCheck') {
    // Check and execute DCA investments
    chrome.storage.local.get('portfolio_management_enabled', (data) => {
      if (data.portfolio_management_enabled) {
        import(chrome.runtime.getURL('src/portfolio-manager.js'))
          .then(module => {
            module.cipherPortfolioManager.checkAndExecuteDCA()
              .then(executedStrategies => {
                if (executedStrategies.length > 0) {
                  console.log('DCA strategies executed:', executedStrategies);
                  
                  // Send notification for executed DCA strategies
                  chrome.storage.local.get('limit_order_notifications', (data) => {
                    if (data.limit_order_notifications) {
                      executedStrategies.forEach(strategy => {
                        chrome.notifications.create({
                          type: 'basic',
                          iconUrl: './icon-dark-128.png',
                          title: 'DCA Investment Executed',
                          message: `DCA investment executed for ${strategy.position.tokenSymbol} at price ${strategy.position.entryPrice.toFixed(6)}.`,
                          priority: 2
                        });
                      });
                    }
                  });
                } else {
                  console.log('DCA check completed, no strategies executed');
                }
              })
              .catch(error => {
                console.error('Error executing DCA strategies:', error);
              });
          })
          .catch(error => {
            console.error('Failed to load portfolio manager module:', error);
          });
      }
    });
  }
}); 
