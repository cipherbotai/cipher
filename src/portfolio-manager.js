/**
 * Portfolio Management Module for Cipher Extension
 * Provides sophisticated trading strategies and risk management
 */

// Risk levels for position sizing
const RISK_LEVELS = {
  VERY_LOW: {
    maxPositionSize: 0.02, // 2% of portfolio per position
    stopLossPercentage: 0.02,
    maxDrawdownAllowed: 0.05,
    maxLeverage: 1,
    description: 'Extremely conservative approach with minimal risk'
  },
  LOW: {
    maxPositionSize: 0.05, // 5% of portfolio per position
    stopLossPercentage: 0.05,
    maxDrawdownAllowed: 0.10,
    maxLeverage: 1.5,
    description: 'Conservative approach with limited risk'
  },
  MEDIUM: {
    maxPositionSize: 0.10, // 10% of portfolio per position
    stopLossPercentage: 0.08,
    maxDrawdownAllowed: 0.15,
    maxLeverage: 2,
    description: 'Balanced approach with moderate risk'
  },
  HIGH: {
    maxPositionSize: 0.15, // 15% of portfolio per position
    stopLossPercentage: 0.12,
    maxDrawdownAllowed: 0.25,
    maxLeverage: 3,
    description: 'Aggressive approach with significant risk'
  },
  VERY_HIGH: {
    maxPositionSize: 0.25, // 25% of portfolio per position
    stopLossPercentage: 0.20,
    maxDrawdownAllowed: 0.40,
    maxLeverage: 5,
    description: 'Extremely aggressive approach with high risk'
  }
};

// Strategy types for portfolio management
const STRATEGY_TYPES = {
  DCA: 'DOLLAR_COST_AVERAGING',
  MARTINGALE: 'MARTINGALE',
  ANTI_MARTINGALE: 'ANTI_MARTINGALE',
  GRID_TRADING: 'GRID_TRADING',
  PAIRS_TRADING: 'PAIRS_TRADING',
  MOMENTUM: 'MOMENTUM',
  MEAN_REVERSION: 'MEAN_REVERSION',
  BREAKOUT: 'BREAKOUT',
  TREND_FOLLOWING: 'TREND_FOLLOWING',
  ARBITRAGE: 'ARBITRAGE'
};

// Portfolio state
let portfolioState = {
  positions: {},
  totalValue: 0,
  baseBalance: 0, // In SOL
  riskLevel: 'MEDIUM',
  activeStrategies: {},
  tradingHistory: [],
  performanceMetrics: {
    totalPnL: 0,
    winRate: 0,
    averageWin: 0,
    averageLoss: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    currentDrawdown: 0
  },
  lastUpdated: 0
};

/**
 * Initialize portfolio state
 */
const initializePortfolio = async (baseBalance) => {
  try {
    // Try to load from storage first
    const data = await chrome.storage.local.get('cipher_portfolio_state');
    if (data && data.cipher_portfolio_state) {
      portfolioState = data.cipher_portfolio_state;
      console.log('Portfolio state loaded from storage');
    } else {
      // Initialize with default values
      portfolioState = {
        positions: {},
        totalValue: baseBalance || 0,
        baseBalance: baseBalance || 0,
        riskLevel: 'MEDIUM',
        activeStrategies: {},
        tradingHistory: [],
        performanceMetrics: {
          totalPnL: 0,
          winRate: 0,
          averageWin: 0,
          averageLoss: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          currentDrawdown: 0
        },
        lastUpdated: Date.now()
      };
      console.log('New portfolio state initialized');
    }

    // Save portfolio state
    await savePortfolioState();
    return portfolioState;
  } catch (error) {
    console.error('Error initializing portfolio:', error);
    throw error;
  }
};

/**
 * Save portfolio state to storage
 */
const savePortfolioState = async () => {
  try {
    portfolioState.lastUpdated = Date.now();
    await chrome.storage.local.set({ 'cipher_portfolio_state': portfolioState });
    return true;
  } catch (error) {
    console.error('Error saving portfolio state:', error);
    return false;
  }
};

/**
 * Calculate position size based on risk level and signal confidence
 */
const calculatePositionSize = (tokenAddress, signal, balance = null) => {
  if (!signal || !signal.confidence) {
    return 0;
  }

  // Get balance to use
  const availableBalance = balance || portfolioState.baseBalance;
  if (!availableBalance || availableBalance <= 0) {
    return 0;
  }

  // Get risk profile
  const riskProfile = RISK_LEVELS[portfolioState.riskLevel] || RISK_LEVELS.MEDIUM;
  
  // Base position size on risk profile
  let basePositionSize = availableBalance * riskProfile.maxPositionSize;
  
  // Scale by signal confidence
  const confidenceAdjustedSize = basePositionSize * signal.confidence;
  
  // Check if there's an existing position
  const existingPosition = portfolioState.positions[tokenAddress];
  if (existingPosition) {
    // Limit additional investment in the same token
    const currentInvestment = existingPosition.totalInvested;
    const maxTotalInvestment = availableBalance * (riskProfile.maxPositionSize * 1.5);
    const maxAdditionalInvestment = Math.max(0, maxTotalInvestment - currentInvestment);
    return Math.min(confidenceAdjustedSize, maxAdditionalInvestment);
  }
  
  return confidenceAdjustedSize;
};

/**
 * Calculate stop loss and take profit levels
 */
const calculateRiskManagementLevels = (entryPrice, signal, riskProfile = null) => {
  // Determine risk profile to use
  const profile = riskProfile || RISK_LEVELS[portfolioState.riskLevel] || RISK_LEVELS.MEDIUM;
  
  // Default values
  let stopLoss = 0;
  let takeProfit = 0;
  
  // Action is buy/long
  if (['buy', 'strong_buy'].includes(signal.signal)) {
    // Stop loss below entry price
    stopLoss = entryPrice * (1 - profile.stopLossPercentage);
    
    // Take profit based on risk-reward ratio (usually 2:1 or 3:1)
    const riskRewardRatio = 2; // 2:1 risk-reward ratio
    takeProfit = entryPrice + (riskRewardRatio * (entryPrice - stopLoss));
  } 
  // Action is sell/short
  else if (['sell', 'strong_sell'].includes(signal.signal)) {
    // Stop loss above entry price
    stopLoss = entryPrice * (1 + profile.stopLossPercentage);
    
    // Take profit based on risk-reward ratio (usually 2:1 or 3:1)
    const riskRewardRatio = 2; // 2:1 risk-reward ratio
    takeProfit = entryPrice - (riskRewardRatio * (stopLoss - entryPrice));
  }
  
  // If we have a target price from the signal, adjust take profit
  if (signal.targetPrice) {
    // Weighted average between calculated takeProfit and signal targetPrice
    takeProfit = (takeProfit + (signal.targetPrice * 2)) / 3;
  }
  
  return {
    stopLoss,
    takeProfit,
    trailingStopActivationPrice: takeProfit * 0.7, // Activate trailing stop when price reaches 70% of take profit
    trailingStopPercentage: profile.stopLossPercentage * 1.5
  };
};

/**
 * Add a new position to the portfolio
 */
const addPosition = async (positionData) => {
  try {
    if (!positionData.tokenAddress || !positionData.entryPrice || !positionData.amount) {
      throw new Error('Missing required position data');
    }
    
    // Generate position ID
    const positionId = `position_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    // Create new position object
    const newPosition = {
      id: positionId,
      tokenAddress: positionData.tokenAddress,
      tokenSymbol: positionData.tokenSymbol || 'Unknown',
      entryPrice: positionData.entryPrice,
      currentPrice: positionData.entryPrice,
      amount: positionData.amount,
      totalInvested: positionData.totalInvested || (positionData.entryPrice * positionData.amount),
      stopLoss: positionData.stopLoss,
      takeProfit: positionData.takeProfit,
      trailingStopActivated: false,
      trailingStopDistance: positionData.trailingStopDistance || 0.05,
      highestPrice: positionData.entryPrice,
      status: 'OPEN',
      openDate: positionData.openDate || new Date().toISOString(),
      closeDate: null,
      pnl: 0,
      pnlPercentage: 0,
      notes: positionData.notes || '',
      strategy: positionData.strategy || STRATEGY_TYPES.TREND_FOLLOWING,
      tags: positionData.tags || [],
      signal: positionData.signal || null
    };
    
    // Add to positions
    if (!portfolioState.positions[positionData.tokenAddress]) {
      portfolioState.positions[positionData.tokenAddress] = newPosition;
    } else {
      // Position already exists, calculate average entry price
      const existingPosition = portfolioState.positions[positionData.tokenAddress];
      const totalAmount = existingPosition.amount + newPosition.amount;
      const totalInvested = existingPosition.totalInvested + newPosition.totalInvested;
      const averageEntryPrice = totalInvested / totalAmount;
      
      // Update existing position
      existingPosition.entryPrice = averageEntryPrice;
      existingPosition.amount = totalAmount;
      existingPosition.totalInvested = totalInvested;
      
      // Update stop loss and take profit if specified
      if (positionData.stopLoss) {
        existingPosition.stopLoss = positionData.stopLoss;
      }
      if (positionData.takeProfit) {
        existingPosition.takeProfit = positionData.takeProfit;
      }
      
      // Add to trading history
      portfolioState.tradingHistory.push({
        type: 'ADD_TO_POSITION',
        positionId: existingPosition.id,
        tokenAddress: existingPosition.tokenAddress,
        tokenSymbol: existingPosition.tokenSymbol,
        price: newPosition.entryPrice,
        amount: newPosition.amount,
        totalInvested: newPosition.totalInvested,
        timestamp: new Date().toISOString()
      });
    }
    
    // Update total portfolio value
    await updatePortfolioValue();
    
    // Save portfolio state
    await savePortfolioState();
    
    return newPosition;
  } catch (error) {
    console.error('Error adding position:', error);
    throw error;
  }
};

/**
 * Close a position
 */
const closePosition = async (tokenAddress, exitPrice, amount = null) => {
  try {
    const position = portfolioState.positions[tokenAddress];
    if (!position) {
      throw new Error(`Position for token ${tokenAddress} not found`);
    }
    
    // If amount is null, close entire position
    const closeAmount = amount || position.amount;
    const percentageClosed = closeAmount / position.amount;
    
    // Calculate profit/loss
    const investmentClosed = position.totalInvested * percentageClosed;
    const exitValue = closeAmount * exitPrice;
    const pnl = exitValue - investmentClosed;
    const pnlPercentage = pnl / investmentClosed;
    
    // Update trading history
    portfolioState.tradingHistory.push({
      type: 'CLOSE_POSITION',
      positionId: position.id,
      tokenAddress,
      tokenSymbol: position.tokenSymbol,
      entryPrice: position.entryPrice,
      exitPrice,
      amount: closeAmount,
      pnl,
      pnlPercentage,
      timestamp: new Date().toISOString()
    });
    
    // If closing entire position
    if (closeAmount >= position.amount) {
      position.status = 'CLOSED';
      position.closeDate = new Date().toISOString();
      position.exitPrice = exitPrice;
      position.pnl = pnl;
      position.pnlPercentage = pnlPercentage;
      
      // Remove from active positions
      delete portfolioState.positions[tokenAddress];
    } else {
      // Partially close position
      position.amount -= closeAmount;
      position.totalInvested -= investmentClosed;
    }
    
    // Update portfolio metrics
    portfolioState.performanceMetrics.totalPnL += pnl;
    
    // Update win rate
    const wins = portfolioState.tradingHistory.filter(t => t.type === 'CLOSE_POSITION' && t.pnl > 0).length;
    const losses = portfolioState.tradingHistory.filter(t => t.type === 'CLOSE_POSITION' && t.pnl <= 0).length;
    portfolioState.performanceMetrics.winRate = wins / (wins + losses);
    
    // Update average win/loss
    const winTrades = portfolioState.tradingHistory.filter(t => t.type === 'CLOSE_POSITION' && t.pnl > 0);
    const lossTrades = portfolioState.tradingHistory.filter(t => t.type === 'CLOSE_POSITION' && t.pnl <= 0);
    
    if (winTrades.length > 0) {
      portfolioState.performanceMetrics.averageWin = winTrades.reduce((sum, t) => sum + t.pnlPercentage, 0) / winTrades.length;
    }
    
    if (lossTrades.length > 0) {
      portfolioState.performanceMetrics.averageLoss = lossTrades.reduce((sum, t) => sum + t.pnlPercentage, 0) / lossTrades.length;
    }
    
    // Update base balance
    portfolioState.baseBalance += exitValue;
    
    // Update total portfolio value
    await updatePortfolioValue();
    
    // Save portfolio state
    await savePortfolioState();
    
    return {
      tokenAddress,
      exitPrice,
      amount: closeAmount,
      pnl,
      pnlPercentage
    };
  } catch (error) {
    console.error('Error closing position:', error);
    throw error;
  }
};

/**
 * Update position prices and check for stop loss/take profit levels
 */
const updatePositionPrices = async () => {
  try {
    const tokenAddresses = Object.keys(portfolioState.positions);
    if (tokenAddresses.length === 0) return [];
    
    const executedOrders = [];
    
    // Update each position
    for (const tokenAddress of tokenAddresses) {
      const position = portfolioState.positions[tokenAddress];
      
      try {
        // Fetch current price
        const currentPrice = await window.cipherLimitOrders.fetchTokenPrice(tokenAddress);
        
        // Update position current price
        position.currentPrice = currentPrice;
        
        // Calculate current P&L
        position.pnl = (currentPrice - position.entryPrice) * position.amount;
        position.pnlPercentage = (currentPrice - position.entryPrice) / position.entryPrice;
        
        // Check if price is new highest price
        if (currentPrice > position.highestPrice) {
          position.highestPrice = currentPrice;
        }
        
        // Check for take profit
        if (position.takeProfit && currentPrice >= position.takeProfit) {
          // Execute take profit
          const result = await closePosition(tokenAddress, currentPrice);
          executedOrders.push({
            type: 'TAKE_PROFIT',
            result
          });
          continue; // Skip further checks for this position
        }
        
        // Check for trailing stop activation
        if (!position.trailingStopActivated && position.trailingStopActivationPrice && 
            currentPrice >= position.trailingStopActivationPrice) {
          position.trailingStopActivated = true;
          console.log(`Trailing stop activated for ${position.tokenSymbol}`);
        }
        
        // Check trailing stop if activated
        if (position.trailingStopActivated) {
          const trailingStopPrice = position.highestPrice * (1 - position.trailingStopDistance);
          
          if (currentPrice <= trailingStopPrice) {
            // Execute trailing stop
            const result = await closePosition(tokenAddress, currentPrice);
            executedOrders.push({
              type: 'TRAILING_STOP',
              result
            });
            continue; // Skip further checks for this position
          }
        }
        
        // Check for stop loss
        if (position.stopLoss && currentPrice <= position.stopLoss) {
          // Execute stop loss
          const result = await closePosition(tokenAddress, currentPrice);
          executedOrders.push({
            type: 'STOP_LOSS',
            result
          });
        }
      } catch (error) {
        console.error(`Error updating position for ${tokenAddress}:`, error);
      }
    }
    
    // Update total portfolio value
    await updatePortfolioValue();
    
    // Save portfolio state
    await savePortfolioState();
    
    return executedOrders;
  } catch (error) {
    console.error('Error updating position prices:', error);
    throw error;
  }
};

/**
 * Update total portfolio value
 */
const updatePortfolioValue = async () => {
  try {
    let positionsValue = 0;
    
    // Calculate value of all open positions
    for (const tokenAddress in portfolioState.positions) {
      const position = portfolioState.positions[tokenAddress];
      positionsValue += position.currentPrice * position.amount;
    }
    
    // Total portfolio value is base balance + positions value
    portfolioState.totalValue = portfolioState.baseBalance + positionsValue;
    
    // Calculate drawdown
    const allTrades = portfolioState.tradingHistory.filter(t => t.type === 'CLOSE_POSITION');
    if (allTrades.length > 0) {
      // Find highest portfolio value from trade history
      let highestValue = portfolioState.totalValue;
      let highestTimestamp = Date.now();
      
      allTrades.forEach(trade => {
        // Calculate portfolio value after each trade
        const tradeValue = portfolioState.baseBalance + positionsValue;
        if (tradeValue > highestValue) {
          highestValue = tradeValue;
          highestTimestamp = new Date(trade.timestamp).getTime();
        }
      });
      
      // Calculate current drawdown
      const currentDrawdown = (highestValue - portfolioState.totalValue) / highestValue;
      portfolioState.performanceMetrics.currentDrawdown = Math.max(0, currentDrawdown);
      
      // Update max drawdown if needed
      if (currentDrawdown > portfolioState.performanceMetrics.maxDrawdown) {
        portfolioState.performanceMetrics.maxDrawdown = currentDrawdown;
      }
    }
    
    return portfolioState.totalValue;
  } catch (error) {
    console.error('Error updating portfolio value:', error);
    throw error;
  }
};

/**
 * Implement dollar-cost averaging strategy
 */
const executeDCAStrategy = async (config) => {
  try {
    if (!config.tokenAddress || !config.intervalDays || !config.investmentAmount) {
      throw new Error('Missing required DCA configuration');
    }
    
    // Check if we have enough balance
    if (portfolioState.baseBalance < config.investmentAmount) {
      throw new Error('Insufficient balance for DCA investment');
    }
    
    // Create or update strategy
    const strategyId = `dca_${config.tokenAddress}`;
    portfolioState.activeStrategies[strategyId] = {
      type: STRATEGY_TYPES.DCA,
      tokenAddress: config.tokenAddress,
      tokenSymbol: config.tokenSymbol || 'Unknown',
      intervalDays: config.intervalDays,
      investmentAmount: config.investmentAmount,
      maxInvestments: config.maxInvestments || Infinity,
      currentInvestments: 0,
      lastInvestmentDate: null,
      nextInvestmentDate: new Date(Date.now() + (config.intervalDays * 24 * 60 * 60 * 1000)).toISOString(),
      active: true,
      createdAt: new Date().toISOString()
    };
    
    // Save portfolio state
    await savePortfolioState();
    
    return portfolioState.activeStrategies[strategyId];
  } catch (error) {
    console.error('Error setting up DCA strategy:', error);
    throw error;
  }
};

/**
 * Check and execute DCA investments
 */
const checkAndExecuteDCA = async () => {
  try {
    const now = Date.now();
    const executedStrategies = [];
    
    // Get all active DCA strategies
    const dcaStrategies = Object.entries(portfolioState.activeStrategies)
      .filter(([_, strategy]) => strategy.type === STRATEGY_TYPES.DCA && strategy.active);
    
    for (const [strategyId, strategy] of dcaStrategies) {
      // Check if it's time for investment
      const nextInvestmentDate = new Date(strategy.nextInvestmentDate).getTime();
      
      if (now >= nextInvestmentDate) {
        // Check if we reached max investments
        if (strategy.currentInvestments >= strategy.maxInvestments) {
          // Deactivate strategy
          strategy.active = false;
          continue;
        }
        
        // Check if we have enough balance
        if (portfolioState.baseBalance < strategy.investmentAmount) {
          console.warn(`Insufficient balance for DCA strategy ${strategyId}`);
          continue;
        }
        
        try {
          // Get current price
          const currentPrice = await window.cipherLimitOrders.fetchTokenPrice(strategy.tokenAddress);
          
          // Calculate amount to buy
          const amount = strategy.investmentAmount / currentPrice;
          
          // Create position data
          const positionData = {
            tokenAddress: strategy.tokenAddress,
            tokenSymbol: strategy.tokenSymbol,
            entryPrice: currentPrice,
            amount,
            totalInvested: strategy.investmentAmount,
            strategy: STRATEGY_TYPES.DCA,
            notes: `DCA investment #${strategy.currentInvestments + 1}`,
            tags: ['DCA']
          };
          
          // Add position
          const position = await addPosition(positionData);
          
          // Update strategy
          strategy.currentInvestments += 1;
          strategy.lastInvestmentDate = new Date().toISOString();
          strategy.nextInvestmentDate = new Date(now + (strategy.intervalDays * 24 * 60 * 60 * 1000)).toISOString();
          
          // Update base balance
          portfolioState.baseBalance -= strategy.investmentAmount;
          
          executedStrategies.push({
            strategyId,
            position
          });
        } catch (error) {
          console.error(`Error executing DCA strategy ${strategyId}:`, error);
        }
      }
    }
    
    // Save portfolio state if any strategies were executed
    if (executedStrategies.length > 0) {
      await savePortfolioState();
    }
    
    return executedStrategies;
  } catch (error) {
    console.error('Error checking DCA strategies:', error);
    throw error;
  }
};

/**
 * Implement grid trading strategy
 */
const executeGridStrategy = async (config) => {
  try {
    if (!config.tokenAddress || !config.gridLevels || !config.totalInvestment) {
      throw new Error('Missing required grid strategy configuration');
    }
    
    // Check if we have enough balance
    if (portfolioState.baseBalance < config.totalInvestment) {
      throw new Error('Insufficient balance for grid strategy');
    }
    
    // Sort grid levels
    const sortedLevels = [...config.gridLevels].sort((a, b) => a - b);
    
    // Get current price
    const currentPrice = await window.cipherLimitOrders.fetchTokenPrice(config.tokenAddress);
    
    // Create grid orders
    const orders = [];
    const investmentPerGrid = config.totalInvestment / sortedLevels.length;
    
    for (let i = 0; i < sortedLevels.length; i++) {
      const price = sortedLevels[i];
      
      // Create buy order if price is below current price
      if (price < currentPrice) {
        const orderData = {
          tokenMint: config.tokenAddress,
          tokenSymbol: config.tokenSymbol || 'Unknown',
          type: window.cipherLimitOrders.ORDER_TYPES.LIMIT_BUY,
          price,
          amount: investmentPerGrid / price,
          notes: `Grid strategy buy order #${i+1}`,
          tags: ['GRID']
        };
        
        // Create limit order
        const order = await window.cipherLimitOrders.createLimitOrder(orderData);
        orders.push(order);
      }
      // Create sell order if price is above current price
      else if (price > currentPrice) {
        // Check if we already have a position
        if (portfolioState.positions[config.tokenAddress]) {
          const position = portfolioState.positions[config.tokenAddress];
          
          // Calculate sell amount (proportional to grid level)
          const sellAmount = position.amount / (sortedLevels.length - i);
          
          const orderData = {
            tokenMint: config.tokenAddress,
            tokenSymbol: config.tokenSymbol || 'Unknown',
            type: window.cipherLimitOrders.ORDER_TYPES.LIMIT_SELL,
            price,
            amount: sellAmount,
            notes: `Grid strategy sell order #${i+1}`,
            tags: ['GRID']
          };
          
          // Create limit order
          const order = await window.cipherLimitOrders.createLimitOrder(orderData);
          orders.push(order);
        }
      }
    }
    
    // Create strategy in portfolio
    const strategyId = `grid_${config.tokenAddress}`;
    portfolioState.activeStrategies[strategyId] = {
      type: STRATEGY_TYPES.GRID_TRADING,
      tokenAddress: config.tokenAddress,
      tokenSymbol: config.tokenSymbol || 'Unknown',
      gridLevels: sortedLevels,
      totalInvestment: config.totalInvestment,
      investmentPerGrid: investmentPerGrid,
      orders: orders.map(o => o.id),
      active: true,
      createdAt: new Date().toISOString()
    };
    
    // Save portfolio state
    await savePortfolioState();
    
    return {
      strategyId,
      orders
    };
  } catch (error) {
    console.error('Error setting up grid strategy:', error);
    throw error;
  }
};

/**
 * Get portfolio summary
 */
const getPortfolioSummary = async () => {
  try {
    // Update portfolio value
    await updatePortfolioValue();
    
    // Calculate allocation
    const allocation = {};
    let totalPositionsValue = 0;
    
    for (const tokenAddress in portfolioState.positions) {
      const position = portfolioState.positions[tokenAddress];
      const positionValue = position.currentPrice * position.amount;
      totalPositionsValue += positionValue;
      
      allocation[position.tokenSymbol] = {
        value: positionValue,
        percentage: 0 // Will update after calculating total
      };
    }
    
    // Update allocation percentages
    for (const symbol in allocation) {
      allocation[symbol].percentage = totalPositionsValue > 0 ? 
        allocation[symbol].value / totalPositionsValue : 0;
    }
    
    // Create summary
    return {
      totalValue: portfolioState.totalValue,
      baseBalance: portfolioState.baseBalance,
      positionsValue: totalPositionsValue,
      positionsCount: Object.keys(portfolioState.positions).length,
      allocation,
      riskLevel: portfolioState.riskLevel,
      activeStrategiesCount: Object.values(portfolioState.activeStrategies)
        .filter(s => s.active).length,
      performanceMetrics: portfolioState.performanceMetrics,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting portfolio summary:', error);
    throw error;
  }
};

// Initialize on module load
(async () => {
  try {
    await initializePortfolio();
    console.log('Portfolio manager initialized');
  } catch (error) {
    console.error('Error initializing portfolio manager:', error);
  }
})();

// Export module functions
window.cipherPortfolioManager = {
  RISK_LEVELS,
  STRATEGY_TYPES,
  initializePortfolio,
  calculatePositionSize,
  calculateRiskManagementLevels,
  addPosition,
  closePosition,
  updatePositionPrices,
  executeDCAStrategy,
  executeGridStrategy,
  getPortfolioSummary
}; 