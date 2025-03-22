const insertElementAfter = (rNode, nNode) => {
  rNode.parentNode.insertBefore(nNode, rNode.nextSibling);
};

const insertElementBefore = (rNode, nNode) => {
  rNode.parentNode.insertBefore(nNode, rNode);
};

const getcipherToken = async () => {
  const data = await chrome.storage.local.get("cipher_auth_token");
  return data["cipher_auth_token"] || "";
};
const cleanEscapedSvg = (escapedSvg) => {
  let cleanedSvg = escapedSvg.replace(/\\"/g, '"');
  cleanedSvg = cleanedSvg.replace(/\\n/g, "");
  return cleanedSvg;
};
const createRandomClassname = () => {
  const animals = [
    "cat",
    "dog",
    "elephant",
    "lion",
    "penguin",
    "tiger",
    "wolf",
    "bear",
    "fox",
    "panda",
    "koala",
    "zebra",
    "giraffe",
    "monkey",
    "kangaroo",
  ];
  const fruits = [
    "apple",
    "banana",
    "orange",
    "mango",
    "grape",
    "kiwi",
    "peach",
    "plum",
    "cherry",
    "pear",
    "lemon",
    "lime",
    "melon",
    "berry",
    "fig",
  ];
  const colors = [
    "red",
    "blue",
    "green",
    "yellow",
    "purple",
    "pink",
    "black",
    "white",
    "orange",
    "gray",
    "gold",
    "silver",
    "bronze",
    "cyan",
    "magenta",
  ];
  const adjectives = [
    "happy",
    "swift",
    "clever",
    "brave",
    "mighty",
    "gentle",
    "wild",
    "calm",
    "bright",
    "wise",
    "epic",
    "cosmic",
    "magic",
    "mystic",
    "crazy",
  ];
  const elements = [
    "fire",
    "water",
    "earth",
    "air",
    "metal",
    "wood",
    "ice",
    "thunder",
    "light",
    "dark",
    "crystal",
    "plasma",
    "steam",
    "lava",
    "storm",
  ];
  const tech = [
    "pixel",
    "cyber",
    "data",
    "crypto",
    "quantum",
    "digital",
    "node",
    "cloud",
    "web",
    "net",
    "bot",
    "chip",
    "code",
    "tech",
    "byte",
  ];

  const getRandomItems = (arr, count = 1) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return count === 1 ? shuffled[0] : shuffled.slice(0, count);
  };

  const getRandomSpecialChar = () => {
    const specialChars = ["_", "-"];
    return specialChars[Math.floor(Math.random() * specialChars.length)];
  };

  const getRandomNumber = () => {
    const length = Math.floor(Math.random() * 4) + 1;
    return Math.floor(Math.random() * Math.pow(10, length));
  };

  const getRandomHex = () => {
    return Math.floor(Math.random() * 16777215).toString(16);
  };

  const allCategories = [animals, fruits, colors, adjectives, elements, tech];

  const numCategories = Math.floor(Math.random() * 3) + 1;
  const selectedCategories = getRandomItems(allCategories, numCategories);

  const parts = [];

  selectedCategories.forEach((category) => {
    parts.push(getRandomItems(category));
  });

  if (Math.random() > 0.5) parts.push(getRandomNumber());
  if (Math.random() > 0.7) parts.push(getRandomHex());
  if (Math.random() > 0.8) parts.push(Date.now() % 10000);

  const shuffledParts = [...parts].sort(() => 0.5 - Math.random());

  return shuffledParts.join(getRandomSpecialChar());
};
const saveFlyingModalPosition = (left, top) => {
  chrome.storage.local.set(
    {
      flying_modal_position: { left, top },
    },
    () => {},
  );
};
const addressPurifier = (address) => {
  const cleanedAddress = address.replace(/Share$/, "").trim();

  const match = cleanedAddress.match(/^[^:]*:(.*)/);
  return match ? match[1].trim() : cleanedAddress;
};

const fetchTokenInfo = async (tokenMintAddress) => {
  try {
    const response = await fetch(
      `https://api4.axiom.trade/pair-info?pairAddress=${tokenMintAddress}`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching token information:", error);
    throw error;
  }
};

const checkDuplicateTransaction = async (payload) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(["current_buy_tx", "recent_txs"], (storedData) => {
      const currentTx = storedData.current_buy_tx
        ? JSON.parse(storedData.current_buy_tx)
        : null;
      const recentTxs = storedData.recent_txs
        ? JSON.parse(storedData.recent_txs)
        : [];

      if (currentTx) {
        const isDuplicate =
          currentTx.mint === payload.mint &&
          currentTx.method === payload.method &&
          currentTx.amount === payload.amount &&
          currentTx.timestamp === payload.timestamp;

        if (isDuplicate) {
          setTimeout(() => {
            chrome.storage.local
              .set({
                current_buy_tx: JSON.stringify({}),
              })
              .then(() => {});
          }, 1000);
          reject(new Error("Duplicate transaction detected"));
          return;
        }
      }

      const isRecentDuplicate = recentTxs.some((tx) => {
        return (
          tx.mint === payload.mint &&
          tx.method === payload.method &&
          tx.amount === payload.amount &&
          tx.timestamp === payload.timestamp
        );
      });

      if (isRecentDuplicate) {
        reject(
          new Error("Duplicate transaction detected in recent transactions"),
        );
        return;
      }

      recentTxs.push(payload);
      if (recentTxs.length > 5) {
        recentTxs.shift();
      }

      chrome.storage.local
        .set({
          current_buy_tx: JSON.stringify(payload),
          recent_txs: JSON.stringify(recentTxs),
        })
        .then(() => {
          resolve(false);
        });
    });
  });
};

const transactToken = async (
  mintAddress,
  method,
  value,
  authToken,
  activePresetValues,
  solAmount,
) => {
  try {
    const payload = {
      mint: mintAddress,
      method: method,
      amount: parseFloat(value) ?? null,
      buyFee: null,
      buyTip: null,
      buySlippage: null,
      sellFee: null,
      sellTip: null,
      sellSlippage: null,
      solAmount: solAmount || null,
    };

    const timestamp = Date.now() / 1000;
    const payloadWithTimestamp = {
      ...payload,
      timestamp,
    };

    await checkDuplicateTransaction(payloadWithTimestamp);

    chrome.storage.local.set({
      current_buy_tx: JSON.stringify(payloadWithTimestamp),
    });

    if (method === "buy") {
      payload.buyFee = activePresetValues["buy-fee"];
      payload.buyTip = activePresetValues["buy-tip"];
      payload.buySlippage = activePresetValues["buy-slippage"];
    } else if (method === "sell") {
      payload.sellFee = activePresetValues["sell-fee"];
      payload.sellTip = activePresetValues["sell-tip"];
      payload.sellSlippage = activePresetValues["sell-slippage"];
    } else if (method === "snipe") {
    }

    const response = await fetch("https://api.tradeoncipher.io/api-v1/transact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": authToken,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to buy token:, ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success) {
    } else {
    }

    return result.success;
  } catch (error) {}
};
