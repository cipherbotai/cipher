/**
 * Sentiment Analysis Module for Cipher Extension
 * Analyzes social and market sentiment to enhance trading decisions
 */

// Sentiment scoring constants
const SENTIMENT_SCORES = {
  VERY_BEARISH: -2,
  BEARISH: -1,
  NEUTRAL: 0,
  BULLISH: 1,
  VERY_BULLISH: 2
};

// Sentiment sources
const SENTIMENT_SOURCES = {
  TWITTER: 'TWITTER',
  DISCORD: 'DISCORD',
  TELEGRAM: 'TELEGRAM',
  NEWS: 'NEWS',
  REDDIT: 'REDDIT',
  FEAR_GREED_INDEX: 'FEAR_GREED_INDEX',
  FUNDING_RATES: 'FUNDING_RATES',
  OPEN_INTEREST: 'OPEN_INTEREST',
  PRICE_ACTION: 'PRICE_ACTION'
};

// Keywords for sentiment analysis
const BULLISH_KEYWORDS = [
  'moon', 'pump', 'bullish', 'buy', 'long', 'hodl', 'hold', 'green',
  'up', 'growth', 'climb', 'rising', 'rocket', 'breakout', 'bull',
  'accumulate', 'undervalued', 'oversold', 'support', 'bottom'
];

const BEARISH_KEYWORDS = [
  'dump', 'bearish', 'sell', 'short', 'red', 'down', 'dip', 'crash',
  'falling', 'drop', 'bear', 'exit', 'overvalued', 'overbought',
  'resistance', 'top', 'correction', 'bubble', 'panic'
];

const EMOJI_SENTIMENT = {
  '🚀': 2,
  '🌙': 2,
  '📈': 1,
  '💰': 1,
  '💎': 1,
  '🙌': 1,
  '👍': 1,
  '🔥': 1,
  '📉': -1,
  '👎': -1,
  '💩': -2,
  '🐻': -1,
  '🐂': 1
};

// State for sentiment tracking
let sentimentCache = {
  tokenSentiments: {},
  lastUpdated: {},
  globalMarketSentiment: {
    score: 0,
    lastUpdated: 0
  }
};

/**
 * Analyze sentiment of a text message
 * @param {string} text - The text to analyze
 * @returns {Object} Sentiment analysis result
 */
const analyzeSentiment = (text) => {
  if (!text || typeof text !== 'string') {
    return { score: 0, magnitude: 0, classification: 'NEUTRAL' };
  }

  // Convert to lowercase for consistent matching
  const lowerText = text.toLowerCase();
  let score = 0;
  let bullishMatches = [];
  let bearishMatches = [];

  // Check for bullish keywords
  BULLISH_KEYWORDS.forEach(keyword => {
    // Full word match with word boundaries
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      score += matches.length;
      bullishMatches.push(...matches);
    }
  });

  // Check for bearish keywords
  BEARISH_KEYWORDS.forEach(keyword => {
    // Full word match with word boundaries
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      score -= matches.length;
      bearishMatches.push(...matches);
    }
  });

  // Extract emojis and analyze their sentiment
  const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
  const emojis = text.match(emojiRegex) || [];
  
  emojis.forEach(emoji => {
    if (EMOJI_SENTIMENT[emoji]) {
      score += EMOJI_SENTIMENT[emoji];
    }
  });

  // Calculate magnitude based on total matches
  const magnitude = bullishMatches.length + bearishMatches.length + emojis.length;

  // Determine classification
  let classification;
  if (score <= -5) classification = 'VERY_BEARISH';
  else if (score < 0) classification = 'BEARISH';
  else if (score === 0) classification = 'NEUTRAL';
  else if (score < 5) classification = 'BULLISH';
  else classification = 'VERY_BULLISH';

  return {
    score,
    magnitude,
    classification,
    details: {
      bullishMatches,
      bearishMatches,
      emojis
    }
  };
};

/**
 * Analyze sentiment from social media content for a specific token
 * @param {string} tokenSymbol - The token symbol to analyze
 * @param {Array} messages - Array of social media messages
 * @param {string} source - Source of the messages
 */
const analyzeSocialSentiment = (tokenSymbol, messages, source = SENTIMENT_SOURCES.TWITTER) => {
  if (!messages || messages.length === 0) {
    return {
      tokenSymbol,
      source,
      overallSentiment: 'NEUTRAL',
      sentimentScore: 0,
      momentum: 0,
      messageCount: 0,
      timeAnalyzed: Date.now()
    };
  }

  let totalScore = 0;
  let totalMagnitude = 0;
  let sentimentResults = [];

  // Analyze each message
  messages.forEach(message => {
    const sentiment = analyzeSentiment(message.text);
    totalScore += sentiment.score;
    totalMagnitude += sentiment.magnitude;
    sentimentResults.push({
      text: message.text,
      sentiment,
      timestamp: message.timestamp || Date.now()
    });
  });

  // Calculate average sentiment score
  const avgScore = totalScore / messages.length;
  
  // Determine overall sentiment classification
  let overallSentiment;
  if (avgScore <= -1.5) overallSentiment = 'VERY_BEARISH';
  else if (avgScore < -0.2) overallSentiment = 'BEARISH';
  else if (avgScore < 0.2) overallSentiment = 'NEUTRAL';
  else if (avgScore < 1.5) overallSentiment = 'BULLISH';
  else overallSentiment = 'VERY_BULLISH';

  // Calculate sentiment momentum (change over time)
  let momentum = 0;
  if (messages.length > 1 && messages[0].timestamp) {
    // Sort by timestamp
    sentimentResults.sort((a, b) => a.timestamp - b.timestamp);
    
    // Split into two halves to compare sentiment trend
    const midpoint = Math.floor(sentimentResults.length / 2);
    const firstHalf = sentimentResults.slice(0, midpoint);
    const secondHalf = sentimentResults.slice(midpoint);
    
    const firstHalfScore = firstHalf.reduce((sum, item) => sum + item.sentiment.score, 0) / firstHalf.length;
    const secondHalfScore = secondHalf.reduce((sum, item) => sum + item.sentiment.score, 0) / secondHalf.length;
    
    momentum = secondHalfScore - firstHalfScore;
  }

  const result = {
    tokenSymbol,
    source,
    overallSentiment,
    sentimentScore: avgScore,
    messageMagnitude: totalMagnitude,
    momentum,
    messageCount: messages.length,
    timeAnalyzed: Date.now(),
    sentimentResults
  };

  // Update cache
  if (!sentimentCache.tokenSentiments[tokenSymbol]) {
    sentimentCache.tokenSentiments[tokenSymbol] = {};
  }
  sentimentCache.tokenSentiments[tokenSymbol][source] = result;
  sentimentCache.lastUpdated[tokenSymbol] = Date.now();

  return result;
};

/**
 * Fetch and analyze sentiment from various sources
 * @param {string} tokenSymbol - The token symbol
 * @param {string} tokenAddress - The token contract address
 */
const fetchTokenSentiment = async (tokenSymbol, tokenAddress) => {
  // Check if we have recent cache (within 5 minutes)
  const now = Date.now();
  const cacheTimeout = 5 * 60 * 1000; // 5 minutes
  
  if (
    sentimentCache.tokenSentiments[tokenSymbol] &&
    sentimentCache.lastUpdated[tokenSymbol] &&
    (now - sentimentCache.lastUpdated[tokenSymbol] < cacheTimeout)
  ) {
    return {
      tokenSymbol,
      tokenAddress,
      sentiment: sentimentCache.tokenSentiments[tokenSymbol],
      fromCache: true,
      timeAnalyzed: sentimentCache.lastUpdated[tokenSymbol]
    };
  }

  try {
    // We'll simulate fetching from different sources for demo
    // In a real implementation, this would call APIs for Twitter, Discord, etc.
    
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate simulated sentiment data
    const sentimentData = {
      [SENTIMENT_SOURCES.TWITTER]: simulateSocialSentiment(tokenSymbol, 20, SENTIMENT_SOURCES.TWITTER),
      [SENTIMENT_SOURCES.DISCORD]: simulateSocialSentiment(tokenSymbol, 15, SENTIMENT_SOURCES.DISCORD),
      [SENTIMENT_SOURCES.TELEGRAM]: simulateSocialSentiment(tokenSymbol, 10, SENTIMENT_SOURCES.TELEGRAM),
      [SENTIMENT_SOURCES.REDDIT]: simulateSocialSentiment(tokenSymbol, 8, SENTIMENT_SOURCES.REDDIT)
    };
    
    // Update cache
    sentimentCache.tokenSentiments[tokenSymbol] = sentimentData;
    sentimentCache.lastUpdated[tokenSymbol] = now;
    
    // Calculate aggregate sentiment
    const aggregateSentiment = calculateAggregateSentiment(sentimentData);
    
    return {
      tokenSymbol,
      tokenAddress,
      sentiment: sentimentData,
      aggregateSentiment,
      fromCache: false,
      timeAnalyzed: now
    };
  } catch (error) {
    console.error("Error fetching token sentiment:", error);
    throw error;
  }
};

/**
 * Simulate social sentiment data for testing
 */
const simulateSocialSentiment = (tokenSymbol, messageCount, source) => {
  // Create an array of simulated messages
  const messages = [];
  const bullishProbability = Math.random(); // Random bias towards bullish or bearish
  
  for (let i = 0; i < messageCount; i++) {
    const isBullish = Math.random() < bullishProbability;
    const keywords = isBullish ? 
      BULLISH_KEYWORDS.slice(0, Math.floor(Math.random() * BULLISH_KEYWORDS.length)) : 
      BEARISH_KEYWORDS.slice(0, Math.floor(Math.random() * BEARISH_KEYWORDS.length));
    
    // Create random text with the keywords
    let text = `${tokenSymbol} is ${keywords[Math.floor(Math.random() * keywords.length)]}`;
    
    // Add some random emojis
    const emojis = Object.keys(EMOJI_SENTIMENT);
    if (Math.random() > 0.5) {
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      text += ` ${emoji}`;
    }
    
    messages.push({
      text,
      timestamp: Date.now() - Math.floor(Math.random() * 3600000) // Random time within last hour
    });
  }
  
  return analyzeSocialSentiment(tokenSymbol, messages, source);
};

/**
 * Calculate aggregate sentiment across all sources
 */
const calculateAggregateSentiment = (sentimentData) => {
  if (!sentimentData || Object.keys(sentimentData).length === 0) {
    return {
      overallSentiment: 'NEUTRAL',
      score: 0,
      confidence: 0,
      sources: []
    };
  }
  
  const sources = Object.keys(sentimentData);
  let totalScore = 0;
  let totalMagnitude = 0;
  let totalMessages = 0;
  
  sources.forEach(source => {
    const data = sentimentData[source];
    totalScore += data.sentimentScore * data.messageCount;
    totalMagnitude += data.messageMagnitude;
    totalMessages += data.messageCount;
  });
  
  // Calculate weighted average score
  const avgScore = totalMessages > 0 ? totalScore / totalMessages : 0;
  
  // Determine overall sentiment classification
  let overallSentiment;
  if (avgScore <= -1.5) overallSentiment = 'VERY_BEARISH';
  else if (avgScore < -0.2) overallSentiment = 'BEARISH';
  else if (avgScore < 0.2) overallSentiment = 'NEUTRAL';
  else if (avgScore < 1.5) overallSentiment = 'BULLISH';
  else overallSentiment = 'VERY_BULLISH';
  
  // Calculate confidence based on message magnitude and count
  const confidence = Math.min(1, (totalMagnitude / 100) + (totalMessages / 50));
  
  return {
    overallSentiment,
    score: avgScore,
    confidence,
    sources,
    totalMessages,
    messageMagnitude: totalMagnitude
  };
};

/**
 * Combine technical analysis with sentiment analysis for enhanced trading signals
 */
const createEnhancedTradingSignal = async (tokenSymbol, tokenAddress, technicalSignal) => {
  try {
    // Get sentiment data
    const sentimentData = await fetchTokenSentiment(tokenSymbol, tokenAddress);
    
    // Start with technical signal
    let enhancedSignal = { ...technicalSignal };
    
    // Calculate sentiment influence factor (0-1)
    const sentimentWeight = sentimentData.aggregateSentiment.confidence * 0.4; // Max 40% influence
    
    // Adjust confidence based on sentiment alignment
    const sentimentScore = sentimentData.aggregateSentiment.score;
    const technicalBullish = ['buy', 'strong_buy'].includes(technicalSignal.signal);
    const technicalBearish = ['sell', 'strong_sell'].includes(technicalSignal.signal);
    const sentimentBullish = sentimentScore > 0.2;
    const sentimentBearish = sentimentScore < -0.2;
    
    // Check if sentiment aligns with technical signal
    const aligned = (technicalBullish && sentimentBullish) || (technicalBearish && sentimentBearish);
    
    // Adjust confidence
    if (aligned) {
      enhancedSignal.confidence = Math.min(1, enhancedSignal.confidence + (sentimentWeight * 0.2));
    } else if ((technicalBullish && sentimentBearish) || (technicalBearish && sentimentBullish)) {
      // Sentiment contradicts technical signal
      enhancedSignal.confidence = Math.max(0, enhancedSignal.confidence - (sentimentWeight * 0.2));
    }
    
    // Potentially modify signal based on very strong sentiment
    if (Math.abs(sentimentScore) > 1.5 && sentimentData.aggregateSentiment.confidence > 0.7) {
      if (sentimentScore > 1.5 && !technicalBullish && technicalSignal.signal === 'neutral') {
        enhancedSignal.signal = 'buy';
        enhancedSignal.confidence = Math.min(0.7, sentimentData.aggregateSentiment.confidence);
      } else if (sentimentScore < -1.5 && !technicalBearish && technicalSignal.signal === 'neutral') {
        enhancedSignal.signal = 'sell';
        enhancedSignal.confidence = Math.min(0.7, sentimentData.aggregateSentiment.confidence);
      }
    }
    
    // Add sentiment data to the signal
    enhancedSignal.sentimentData = {
      overallSentiment: sentimentData.aggregateSentiment.overallSentiment,
      sentimentScore,
      sentimentConfidence: sentimentData.aggregateSentiment.confidence,
      sources: sentimentData.aggregateSentiment.sources,
      messageCount: sentimentData.aggregateSentiment.totalMessages
    };
    
    return enhancedSignal;
  } catch (error) {
    console.error("Error creating enhanced trading signal:", error);
    return technicalSignal; // Return original signal if enhancement fails
  }
};

/**
 * Get Fear & Greed Index for the overall market
 * Simulated implementation - would normally call an API
 */
const getFearGreedIndex = async () => {
  // Check cache
  const now = Date.now();
  const cacheTimeout = 60 * 60 * 1000; // 1 hour
  
  if (sentimentCache.globalMarketSentiment.lastUpdated && 
      (now - sentimentCache.globalMarketSentiment.lastUpdated < cacheTimeout)) {
    return sentimentCache.globalMarketSentiment;
  }
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Generate a random value between 0 and 100
  const value = Math.floor(Math.random() * 101);
  
  let classification;
  if (value <= 20) classification = 'Extreme Fear';
  else if (value <= 40) classification = 'Fear';
  else if (value <= 60) classification = 'Neutral';
  else if (value <= 80) classification = 'Greed';
  else classification = 'Extreme Greed';
  
  const result = {
    value,
    classification,
    timestamp: now,
    lastUpdated: now
  };
  
  // Update cache
  sentimentCache.globalMarketSentiment = result;
  
  return result;
};

// Export module functions
window.cipherSentimentAnalysis = {
  SENTIMENT_SCORES,
  SENTIMENT_SOURCES,
  analyzeSentiment,
  analyzeSocialSentiment,
  fetchTokenSentiment,
  createEnhancedTradingSignal,
  getFearGreedIndex
}; 