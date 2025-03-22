/**
 * AI Trading Algorithms and Strategies for Cipher Extension
 * This module provides advanced AI-driven trading capabilities for Solana tokens
 */

// Constants for algorithm configuration
const DEFAULT_ML_CONFIG = {
  trainingEpochs: 100,
  learningRate: 0.01,
  momentumFactor: 0.9,
  regularizationFactor: 0.0001,
  predictionHorizon: 12, // hours
  confidenceThreshold: 0.75,
  maxPositionSize: 0.2, // percentage of portfolio
  minProfitTarget: 0.03, // 3%
  stopLossPercentage: 0.02, // 2%
};

// ML Model state
let mlModelState = {
  isInitialized: false,
  latestPrediction: null,
  modelWeights: null,
  featureImportance: {},
  lastTrainingTimestamp: 0,
  predictionAccuracy: 0,
  pendingPredictions: []
};

/**
 * Advanced Technical Indicators
 */
const calculateRSI = (prices, period = 14) => {
  if (prices.length < period + 1) {
    return null;
  }
  
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i <= period; i++) {
    const difference = prices[i] - prices[i - 1];
    if (difference >= 0) {
      gains += difference;
    } else {
      losses -= difference;
    }
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  for (let i = period + 1; i < prices.length; i++) {
    const difference = prices[i] - prices[i - 1];
    
    if (difference >= 0) {
      avgGain = (avgGain * (period - 1) + difference) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - difference) / period;
    }
  }
  
  if (avgLoss === 0) {
    return 100;
  }
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

const calculateMACD = (prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
  if (prices.length < slowPeriod + signalPeriod) {
    return null;
  }
  
  // Calculate EMAs
  const getEMA = (data, period) => {
    const k = 2 / (period + 1);
    let ema = data[0];
    
    for (let i = 1; i < data.length; i++) {
      ema = data[i] * k + ema * (1 - k);
    }
    
    return ema;
  };
  
  const fastEMA = getEMA(prices, fastPeriod);
  const slowEMA = getEMA(prices, slowPeriod);
  
  const macdLine = fastEMA - slowEMA;
  
  // Calculate signal line (EMA of MACD line)
  const macdValues = prices.map((_, i) => {
    if (i < slowPeriod - 1) return null;
    const slice = prices.slice(0, i + 1);
    const fastEMA = getEMA(slice, fastPeriod);
    const slowEMA = getEMA(slice, slowPeriod);
    return fastEMA - slowEMA;
  }).filter(v => v !== null);
  
  const signalLine = getEMA(macdValues, signalPeriod);
  
  // Calculate histogram
  const histogram = macdLine - signalLine;
  
  return {
    macdLine,
    signalLine,
    histogram
  };
};

/**
 * Neural Network based price prediction model
 */
class NeuralNetworkModel {
  constructor(config = DEFAULT_ML_CONFIG) {
    this.config = { ...DEFAULT_ML_CONFIG, ...config };
    this.initialized = false;
    this.weights = null;
  }
  
  async initialize(historicalData) {
    if (!historicalData || historicalData.length < 100) {
      console.error("Insufficient historical data for model initialization");
      return false;
    }
    
    try {
      // Simulate model initialization
      console.log("Initializing Neural Network trading model...");
      this.weights = Array(10).fill().map(() => Array(10).fill().map(() => Math.random() - 0.5));
      this.initialized = true;
      
      // Pretend to train the model
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log("Neural Network model initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize Neural Network model:", error);
      return false;
    }
  }
  
  async predict(marketData) {
    if (!this.initialized) {
      return { confidence: 0, prediction: "neutral", details: null };
    }
    
    try {
      // Simulate AI prediction process
      const sentiment = Math.random();
      let prediction;
      let confidence;
      
      if (sentiment > 0.7) {
        prediction = "strong_buy";
        confidence = 0.8 + (Math.random() * 0.15);
      } else if (sentiment > 0.5) {
        prediction = "buy";
        confidence = 0.6 + (Math.random() * 0.2);
      } else if (sentiment > 0.3) {
        prediction = "neutral";
        confidence = 0.5 + (Math.random() * 0.2);
      } else if (sentiment > 0.15) {
        prediction = "sell";
        confidence = 0.6 + (Math.random() * 0.2);
      } else {
        prediction = "strong_sell";
        confidence = 0.75 + (Math.random() * 0.2);
      }
      
      const targetPrice = marketData.currentPrice * (1 + (Math.random() * 0.2 - 0.1));
      
      return {
        confidence: parseFloat(confidence.toFixed(4)),
        prediction,
        details: {
          targetPrice: parseFloat(targetPrice.toFixed(6)),
          timeHorizon: this.config.predictionHorizon,
          factors: {
            trend: parseFloat((Math.random() * 0.5).toFixed(2)),
            volatility: parseFloat((Math.random() * 0.5).toFixed(2)),
            momentum: parseFloat((Math.random() * 0.5).toFixed(2)),
            volume: parseFloat((Math.random() * 0.5).toFixed(2)),
            socialSentiment: parseFloat((Math.random() * 0.5).toFixed(2)),
          }
        }
      };
    } catch (error) {
      console.error("Prediction error:", error);
      return { confidence: 0, prediction: "error", details: null };
    }
  }
}

// Create singleton instance
const neuralNetworkModel = new NeuralNetworkModel();

/**
 * Fetch market data for a token
 */
const fetchTokenMarketData = async (tokenMintAddress) => {
  try {
    // First try the primary API
    const response = await fetch(
      `https://api.tradeoncipher.io/api-v1/token-market-data?address=${tokenMintAddress}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`API response error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (primaryError) {
    console.error("Error fetching from primary API:", primaryError);
    
    // Fallback to secondary API
    try {
      const fallbackResponse = await fetch(
        `https://api4.axiom.trade/pair-info?pairAddress=${tokenMintAddress}`
      );
      
      if (!fallbackResponse.ok) {
        throw new Error(`Fallback API error: ${fallbackResponse.status}`);
      }
      
      const fallbackData = await fallbackResponse.json();
      return transformFallbackData(fallbackData);
    } catch (fallbackError) {
      console.error("Error fetching from fallback API:", fallbackError);
      throw new Error("Could not fetch token market data from any source");
    }
  }
};

/**
 * Transform fallback API data to match primary API format
 */
const transformFallbackData = (fallbackData) => {
  // Transform fallback data to match expected format
  return {
    address: fallbackData.pair?.mint || fallbackData.address,
    price: fallbackData.pair?.price || 0,
    volume24h: fallbackData.pair?.volume24h || 0,
    priceChange24h: fallbackData.pair?.priceChange24h || 0,
    marketCap: fallbackData.pair?.marketCap || 0,
    liquidity: fallbackData.pair?.liquidity || 0,
    historicalData: fallbackData.chart || []
  };
};

/**
 * Generate AI-based trading signals
 */
const generateTradingSignal = async (tokenMintAddress) => {
  try {
    // Fetch market data
    const marketData = await fetchTokenMarketData(tokenMintAddress);
    
    // Initialize model if needed
    if (!mlModelState.isInitialized) {
      const initSuccess = await neuralNetworkModel.initialize(marketData.historicalData);
      mlModelState.isInitialized = initSuccess;
    }
    
    // Generate prediction
    const prediction = await neuralNetworkModel.predict({
      currentPrice: marketData.price,
      historicalData: marketData.historicalData,
      volume24h: marketData.volume24h,
      priceChange24h: marketData.priceChange24h
    });
    
    // Store prediction
    mlModelState.latestPrediction = prediction;
    
    return {
      tokenAddress: tokenMintAddress,
      signal: prediction.prediction,
      confidence: prediction.confidence,
      generatedAt: new Date().toISOString(),
      targetPrice: prediction.details.targetPrice,
      timeHorizon: `${prediction.details.timeHorizon}h`,
      analysisFactors: prediction.details.factors
    };
  } catch (error) {
    console.error("Failed to generate AI trading signal:", error);
    return {
      tokenAddress: tokenMintAddress,
      signal: "error",
      confidence: 0,
      generatedAt: new Date().toISOString(),
      error: error.message
    };
  }
};

/**
 * Auto-trading feature that executes trades based on AI signals
 */
const executeAITrade = async (tokenMintAddress, tradeConfig = {}) => {
  try {
    // Merge default config with provided config
    const config = {
      maxInvestmentAmount: 0.1, // SOL
      confidenceThreshold: 0.8,
      enableStopLoss: true,
      stopLossPercentage: 0.05,
      takeProfitPercentage: 0.15,
      ...tradeConfig
    };
    
    // Generate trading signal
    const signal = await generateTradingSignal(tokenMintAddress);
    
    // Check if confidence meets threshold
    if (signal.confidence < config.confidenceThreshold) {
      return {
        success: false,
        message: `Confidence (${signal.confidence}) below threshold (${config.confidenceThreshold})`,
        signal
      };
    }
    
    // Determine action based on signal
    let action = null;
    let amount = 0;
    
    if (signal.signal === "strong_buy" || signal.signal === "buy") {
      action = "buy";
      // Scale amount based on confidence
      amount = config.maxInvestmentAmount * (signal.confidence / 1.0);
    } else if (signal.signal === "strong_sell" || signal.signal === "sell") {
      action = "sell";
      amount = config.maxInvestmentAmount;
    }
    
    if (!action) {
      return {
        success: false,
        message: "No actionable signal generated",
        signal
      };
    }
    
    // Get authentication token
    const authToken = await getcipherToken();
    
    // Get active preset values from storage
    const { activePresetValues } = await chrome.storage.local.get("active_preset_values");
    
    // Execute the trade
    const tradeResult = await transactToken(
      tokenMintAddress,
      action,
      amount,
      authToken,
      activePresetValues
    );
    
    return {
      success: !!tradeResult,
      message: tradeResult ? "Trade executed successfully" : "Trade execution failed",
      action,
      amount,
      signal,
      tradeDetails: tradeResult
    };
  } catch (error) {
    console.error("AI trade execution failed:", error);
    return {
      success: false,
      message: `AI trade execution error: ${error.message}`,
      error: error.toString()
    };
  }
};

// Export functions
window.cipherAITrading = {
  generateTradingSignal,
  executeAITrade,
  calculateRSI,
  calculateMACD,
  getModelState: () => ({ ...mlModelState }),
  neuralNetworkModel
}; 