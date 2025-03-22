/**
 * Limit Orders Management for Cipher Extension
 * This module provides functionality for setting, tracking, and executing limit orders
 */

// Constants
const PRICE_CHECK_INTERVAL = 30000; // 30 seconds
const MAX_ORDER_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const ORDER_TYPES = {
  LIMIT_BUY: 'LIMIT_BUY',
  LIMIT_SELL: 'LIMIT_SELL',
  STOP_LOSS: 'STOP_LOSS',
  TAKE_PROFIT: 'TAKE_PROFIT',
  TRAILING_STOP: 'TRAILING_STOP'
};

// Order status enumeration
const ORDER_STATUS = {
  ACTIVE: 'ACTIVE',
  EXECUTED: 'EXECUTED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
  FAILED: 'FAILED'
};

// Order data storage key
const ORDERS_STORAGE_KEY = 'cipher_limit_orders';
const PRICE_CACHE_KEY = 'cipher_price_cache';

// Global state
let priceCheckInterval = null;
let isMonitoring = false;
let priceCache = {};
let lastPriceUpdate = {};
let pendingTransactions = new Set();

/**
 * Load all limit orders from storage
 */
const loadLimitOrders = async () => {
  const data = await chrome.storage.local.get(ORDERS_STORAGE_KEY);
  return data[ORDERS_STORAGE_KEY] || [];
};

/**
 * Save limit orders to storage
 */
const saveLimitOrders = async (orders) => {
  await chrome.storage.local.set({ [ORDERS_STORAGE_KEY]: orders });
  return true;
};

/**
 * Create a new limit order
 */
const createLimitOrder = async (orderData) => {
  // Validate order data
  if (!orderData.tokenMint || !orderData.type || !orderData.price || !orderData.amount) {
    throw new Error('Invalid order data: required fields missing');
  }

  // Ensure valid order type
  if (!Object.values(ORDER_TYPES).includes(orderData.type)) {
    throw new Error(`Invalid order type: ${orderData.type}`);
  }

  // Create new order object
  const newOrder = {
    id: generateOrderId(),
    tokenMint: orderData.tokenMint,
    tokenSymbol: orderData.tokenSymbol || 'Unknown',
    type: orderData.type,
    price: parseFloat(orderData.price),
    amount: parseFloat(orderData.amount),
    status: ORDER_STATUS.ACTIVE,
    createdAt: new Date().toISOString(),
    expiresAt: orderData.expiresAt || new Date(Date.now() + MAX_ORDER_AGE).toISOString(),
    executedAt: null,
    executionTxId: null,
    notes: orderData.notes || '',
    conditions: orderData.conditions || {},
  };

  // For trailing stop orders, set additional parameters
  if (orderData.type === ORDER_TYPES.TRAILING_STOP) {
    newOrder.trailingDistance = parseFloat(orderData.trailingDistance || 0.05);
    newOrder.highestPrice = parseFloat(orderData.currentPrice || 0);
    newOrder.activationPrice = parseFloat(orderData.activationPrice || 0);
  }

  // Add additional settings if provided
  if (orderData.slippage) {
    newOrder.slippage = parseFloat(orderData.slippage);
  }
  
  if (orderData.fee) {
    newOrder.fee = parseFloat(orderData.fee);
  }
  
  if (orderData.tip) {
    newOrder.tip = parseFloat(orderData.tip);
  }

  // Load existing orders
  const orders = await loadLimitOrders();
  
  // Add new order
  orders.push(newOrder);
  
  // Save updated orders list
  await saveLimitOrders(orders);
  
  // Ensure monitoring is running
  startMonitoring();
  
  return newOrder;
};

/**
 * Cancel a limit order
 */
const cancelLimitOrder = async (orderId) => {
  const orders = await loadLimitOrders();
  const orderIndex = orders.findIndex(order => order.id === orderId);
  
  if (orderIndex === -1) {
    throw new Error(`Order with ID ${orderId} not found`);
  }
  
  orders[orderIndex].status = ORDER_STATUS.CANCELLED;
  orders[orderIndex].updatedAt = new Date().toISOString();
  
  await saveLimitOrders(orders);
  return orders[orderIndex];
};

/**
 * Update an existing limit order
 */
const updateLimitOrder = async (orderId, updatedData) => {
  const orders = await loadLimitOrders();
  const orderIndex = orders.findIndex(order => order.id === orderId);
  
  if (orderIndex === -1) {
    throw new Error(`Order with ID ${orderId} not found`);
  }
  
  const order = orders[orderIndex];
  
  // Only allow updating certain fields if order is still active
  if (order.status !== ORDER_STATUS.ACTIVE) {
    throw new Error(`Cannot update order with status: ${order.status}`);
  }
  
  // Update allowed fields
  const allowedFields = ['price', 'amount', 'expiresAt', 'notes', 'conditions', 'slippage', 'fee', 'tip', 'trailingDistance', 'activationPrice'];
  
  for (const field of allowedFields) {
    if (updatedData[field] !== undefined) {
      // Parse numeric fields
      if (['price', 'amount', 'slippage', 'fee', 'tip', 'trailingDistance', 'activationPrice'].includes(field)) {
        order[field] = parseFloat(updatedData[field]);
      } else {
        order[field] = updatedData[field];
      }
    }
  }
  
  order.updatedAt = new Date().toISOString();
  
  await saveLimitOrders(orders);
  return order;
};

/**
 * Get all limit orders for a specific token
 */
const getTokenLimitOrders = async (tokenMint) => {
  const orders = await loadLimitOrders();
  return orders.filter(order => order.tokenMint === tokenMint);
};

/**
 * Get all active limit orders
 */
const getActiveLimitOrders = async () => {
  const orders = await loadLimitOrders();
  return orders.filter(order => order.status === ORDER_STATUS.ACTIVE);
};

/**
 * Fetch and cache current price for a token
 */
const fetchTokenPrice = async (tokenMint) => {
  // Check if we have a recent price in cache (within last minute)
  const now = Date.now();
  if (
    priceCache[tokenMint] && 
    lastPriceUpdate[tokenMint] && 
    (now - lastPriceUpdate[tokenMint] < 60000)
  ) {
    return priceCache[tokenMint];
  }
  
  try {
    // First try using the primary API
    const response = await fetch(
      `https://api.tradeoncipher.io/api-v1/token-market-data?address=${tokenMint}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Cache price
    priceCache[tokenMint] = parseFloat(data.price);
    lastPriceUpdate[tokenMint] = now;
    
    // Save cache to storage
    chrome.storage.local.set({ [PRICE_CACHE_KEY]: priceCache });
    
    return priceCache[tokenMint];
  } catch (primaryError) {
    console.error("Error fetching from primary API:", primaryError);
    
    // Try fallback API
    try {
      const fallbackResponse = await fetch(
        `https://api4.axiom.trade/pair-info?pairAddress=${tokenMint}`
      );
      
      if (!fallbackResponse.ok) {
        throw new Error(`Fallback API error: ${fallbackResponse.status}`);
      }
      
      const fallbackData = await fallbackResponse.json();
      const price = parseFloat(fallbackData.pair?.price || 0);
      
      // Cache price
      priceCache[tokenMint] = price;
      lastPriceUpdate[tokenMint] = now;
      
      // Save cache to storage
      chrome.storage.local.set({ [PRICE_CACHE_KEY]: priceCache });
      
      return price;
    } catch (fallbackError) {
      console.error("Error fetching token price:", fallbackError);
      throw new Error("Could not fetch token price from any source");
    }
  }
};

/**
 * Generate a unique order ID
 */
const generateOrderId = () => {
  return 'order_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
};

/**
 * Check and execute limit orders
 */
const checkAndExecuteOrders = async () => {
  if (pendingTransactions.size > 0) {
    console.log(`Skipping order check, ${pendingTransactions.size} transactions in progress`);
    return;
  }
  
  try {
    // Load active orders
    const activeOrders = await getActiveLimitOrders();
    
    if (activeOrders.length === 0) {
      // If no active orders, stop the monitoring
      stopMonitoring();
      return;
    }
    
    // Group orders by token to minimize API calls
    const tokenGroups = {};
    activeOrders.forEach(order => {
      if (!tokenGroups[order.tokenMint]) {
        tokenGroups[order.tokenMint] = [];
      }
      tokenGroups[order.tokenMint].push(order);
    });
    
    // Process each token group
    for (const [tokenMint, orders] of Object.entries(tokenGroups)) {
      try {
        // Fetch current price for this token
        const currentPrice = await fetchTokenPrice(tokenMint);
        
        // Check each order for this token
        for (const order of orders) {
          await processOrder(order, currentPrice);
        }
      } catch (tokenError) {
        console.error(`Error processing orders for token ${tokenMint}:`, tokenError);
      }
    }
    
    // Check for expired orders
    await checkExpiredOrders();
    
  } catch (error) {
    console.error("Error checking limit orders:", error);
  }
};

/**
 * Process a single order based on current price
 */
const processOrder = async (order, currentPrice) => {
  if (pendingTransactions.has(order.id)) {
    return; // Skip if this order is already being processed
  }
  
  try {
    // Check if order should be executed
    const shouldExecute = checkOrderExecutionCondition(order, currentPrice);
    
    if (shouldExecute) {
      pendingTransactions.add(order.id);
      
      // Execute the order
      const executionResult = await executeOrder(order, currentPrice);
      
      // Update order status
      await updateOrderAfterExecution(order.id, executionResult);
    } else if (order.type === ORDER_TYPES.TRAILING_STOP) {
      // For trailing stop orders, update the highest price if needed
      if (currentPrice > order.highestPrice) {
        await updateTrailingStopHighestPrice(order.id, currentPrice);
      }
    }
  } catch (error) {
    console.error(`Error processing order ${order.id}:`, error);
  } finally {
    pendingTransactions.delete(order.id);
  }
};

/**
 * Check if an order should be executed based on current price
 */
const checkOrderExecutionCondition = (order, currentPrice) => {
  switch (order.type) {
    case ORDER_TYPES.LIMIT_BUY:
      // Execute if current price <= order price
      return currentPrice <= order.price;
      
    case ORDER_TYPES.LIMIT_SELL:
      // Execute if current price >= order price
      return currentPrice >= order.price;
      
    case ORDER_TYPES.STOP_LOSS:
      // Execute if current price <= order price (selling to prevent further loss)
      return currentPrice <= order.price;
      
    case ORDER_TYPES.TAKE_PROFIT:
      // Execute if current price >= order price (selling to take profit)
      return currentPrice >= order.price;
      
    case ORDER_TYPES.TRAILING_STOP:
      // First check if activation price has been reached
      if (order.activationPrice && currentPrice < order.activationPrice) {
        return false;
      }
      
      // Calculate stop price based on highest observed price minus trailing distance
      const stopPrice = order.highestPrice * (1 - order.trailingDistance);
      
      // Execute if current price <= stop price
      return currentPrice <= stopPrice;
      
    default:
      return false;
  }
};

/**
 * Update highest price for trailing stop order
 */
const updateTrailingStopHighestPrice = async (orderId, currentPrice) => {
  const orders = await loadLimitOrders();
  const orderIndex = orders.findIndex(order => order.id === orderId);
  
  if (orderIndex === -1) return;
  
  orders[orderIndex].highestPrice = currentPrice;
  await saveLimitOrders(orders);
};

/**
 * Execute a limit order
 */
const executeOrder = async (order, currentPrice) => {
  try {
    // Get auth token
    const authToken = await getcipherToken();
    
    // Determine transaction method based on order type
    let method = 'buy';
    if ([ORDER_TYPES.LIMIT_SELL, ORDER_TYPES.STOP_LOSS, ORDER_TYPES.TAKE_PROFIT, ORDER_TYPES.TRAILING_STOP].includes(order.type)) {
      method = 'sell';
    }
    
    // Create transaction preset values
    let presetValues = {};
    
    // If order has specific settings, use those
    if (order.slippage) {
      presetValues[`${method}-slippage`] = order.slippage;
    }
    
    if (order.fee) {
      presetValues[`${method}-fee`] = order.fee;
    }
    
    if (order.tip) {
      presetValues[`${method}-tip`] = order.tip;
    }
    
    // If not specific settings in order, get from storage
    if (Object.keys(presetValues).length === 0) {
      const { active_preset_values } = await chrome.storage.local.get('active_preset_values');
      presetValues = active_preset_values || {};
    }
    
    // Execute the transaction
    const result = await transactToken(
      order.tokenMint,
      method,
      order.amount,
      authToken,
      presetValues
    );
    
    return {
      success: !!result,
      transactionId: result?.txId || null,
      executedPrice: currentPrice,
      executedAt: new Date().toISOString(),
      details: result || null
    };
  } catch (error) {
    console.error(`Failed to execute order ${order.id}:`, error);
    return {
      success: false,
      error: error.message,
      executedPrice: currentPrice,
      executedAt: new Date().toISOString()
    };
  }
};

/**
 * Update order status after execution attempt
 */
const updateOrderAfterExecution = async (orderId, executionResult) => {
  const orders = await loadLimitOrders();
  const orderIndex = orders.findIndex(order => order.id === orderId);
  
  if (orderIndex === -1) return;
  
  if (executionResult.success) {
    orders[orderIndex].status = ORDER_STATUS.EXECUTED;
  } else {
    orders[orderIndex].status = ORDER_STATUS.FAILED;
    orders[orderIndex].failureReason = executionResult.error;
  }
  
  orders[orderIndex].executedAt = executionResult.executedAt;
  orders[orderIndex].executionTxId = executionResult.transactionId;
  orders[orderIndex].executedPrice = executionResult.executedPrice;
  orders[orderIndex].executionDetails = executionResult.details;
  
  await saveLimitOrders(orders);
  
  // Notify about the execution
  chrome.runtime.sendMessage({
    context: "cipher_limit_order_executed",
    order: orders[orderIndex]
  });
};

/**
 * Check for expired orders and mark them as such
 */
const checkExpiredOrders = async () => {
  const orders = await loadLimitOrders();
  const now = new Date();
  let updated = false;
  
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    
    if (order.status === ORDER_STATUS.ACTIVE && new Date(order.expiresAt) < now) {
      orders[i].status = ORDER_STATUS.EXPIRED;
      orders[i].updatedAt = now.toISOString();
      updated = true;
    }
  }
  
  if (updated) {
    await saveLimitOrders(orders);
  }
};

/**
 * Start monitoring limit orders
 */
const startMonitoring = () => {
  if (isMonitoring) return;
  
  priceCheckInterval = setInterval(checkAndExecuteOrders, PRICE_CHECK_INTERVAL);
  isMonitoring = true;
  console.log("Limit order monitoring started");
  
  // Initial check
  checkAndExecuteOrders();
};

/**
 * Stop monitoring limit orders
 */
const stopMonitoring = () => {
  if (!isMonitoring) return;
  
  clearInterval(priceCheckInterval);
  isMonitoring = false;
  console.log("Limit order monitoring stopped");
};

/**
 * Initialize the limit order system
 */
const initLimitOrderSystem = async () => {
  try {
    // Load cache from storage
    const data = await chrome.storage.local.get(PRICE_CACHE_KEY);
    if (data[PRICE_CACHE_KEY]) {
      priceCache = data[PRICE_CACHE_KEY];
    }
    
    // Check if there are active orders
    const activeOrders = await getActiveLimitOrders();
    
    if (activeOrders.length > 0) {
      startMonitoring();
    }
    
    console.log("Limit order system initialized, active orders:", activeOrders.length);
  } catch (error) {
    console.error("Failed to initialize limit order system:", error);
  }
};

// Export APIs for the limit order system
window.cipherLimitOrders = {
  createLimitOrder,
  cancelLimitOrder,
  updateLimitOrder,
  getTokenLimitOrders,
  getActiveLimitOrders,
  ORDER_TYPES,
  ORDER_STATUS,
  startMonitoring,
  stopMonitoring,
  fetchTokenPrice
};

// Initialize on load
initLimitOrderSystem(); 