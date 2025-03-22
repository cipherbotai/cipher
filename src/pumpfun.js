const createBackgroundShape = (type) => {
  const shape = document.createElement("div");
  Object.assign(shape.style, {
    position: "absolute",
    width: type === "hexagon" ? "60px" : "40px",
    height: type === "hexagon" ? "60px" : "40px",
    background: "linear-gradient(135deg, rgba(166, 122, 27, 0.1), rgba(166, 122, 27, 0.05))",
    borderRadius: type === "circle" ? "50%" : type === "square" ? "12px" : "0",
    clipPath: type === "hexagon" ? "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" : "none",
    animation: "float 6s ease-in-out infinite",
    zIndex: "0",
    pointerEvents: "none"
  });
  return shape;
};

const getContractSpecificKeys = (contractAddress) => {
  return {
    positionKey: `cipher_chat_position_${contractAddress}`,
    historyKey: `cipher_chat_history_${contractAddress}`
  };
};

const searchAndFindTokenContainer = async (timeoutDuration = 12000) => {
  const interval = 600;
  const endTime = Date.now() + timeoutDuration;

  while (Date.now() < endTime) {
    const container = document.querySelector("div.grid-col-1.gap-4");
    if (container) return container;
    await new Promise((r) => setTimeout(r, interval));
  }

  return null;
};
const searchAndFindChartsContainer = async (timeoutDuration = 20000) => {
  const interval = 1000;
  const endTime = Date.now() + timeoutDuration;

  while (Date.now() < endTime) {
    const chartsContainer = document.querySelector("div.grid.h-fit.gap-2");
    if (chartsContainer) return chartsContainer;
    await new Promise((r) => setTimeout(r, interval));
  }

  return null;
};

const injectcipherContainer = () => {
  try {
    let cipherAuthToken;
    let elementsClassname;
    let buyButtonsList;
    let sellButtonsList;
    chrome.storage.local
      .get([
        "cipher_auth_token",
        "is_buy_pumpfun",
        "custom_buy_value_list",
        "custom_sell_value_list",
        "elements_classname",
      ])
      .then(async (result) => {
        elementsClassname = result.elements_classname;
        cipherAuthToken = result.cipher_auth_token;

        // Get token address from the new selector
        const addressElement = document.querySelector("body > main > div > div.mt-auto.py-4.text-gray-400.md\\:px-12.px-4.bg-primary.z-\\[1\\] > div > a");
        console.log("Address Element found:", addressElement);
        if (!addressElement) return;
        
        const href = addressElement.getAttribute("href");
        console.log("Href found:", href);
        if (!href) return;
        
        const tokenMintAddress = href.split("/").pop();
        console.log("Token Mint Address:", tokenMintAddress);
        if (!tokenMintAddress) return;

        if (Array.isArray(result.custom_buy_value_list) && result.custom_buy_value_list.length > 0) {
          buyButtonsList = result.custom_buy_value_list;
        } else {
          buyButtonsList = [0.5, 1, 2, 5, 10];
        }
        if (Array.isArray(result.custom_sell_value_list) && result.custom_sell_value_list.length > 0) {
          sellButtonsList = result.custom_sell_value_list;
        } else {
          sellButtonsList = [10, 25, 50, 100];
        }

        const previousBuyAndSellButtonsContainer = document.querySelector(
          `div.${CSS.escape(elementsClassname?.bsc)}`,
        );
        if (previousBuyAndSellButtonsContainer) {
          previousBuyAndSellButtonsContainer.remove();
        }

        const targetElement = document.querySelector("body > main > div > div.flex.space-x-8.justify-center > div.flex.flex-col.gap-2.w-2\\/3.h-auto > div.text-sm.flex.flex-wrap.w-full.justify-between.items-center.font-normal.gap-y-\\[14px\\].gap-x-\\[0\\.5px\\].mb-1");
        if (!targetElement) return;

        let  chartsContainer = document.querySelector(
          "div.grid.h-fit.gap-2",
        ).parentElement;
        if (!chartsContainer) return;

        let isBuy = result.is_buy_pumpfun;

        const generatedcipherBuyAndSellButtonsContainerClassName =
          elementsClassname?.bsc;
        const buyAndSellButtonsContainer = document.createElement("div");
        buyAndSellButtonsContainer.classList.add(
          generatedcipherBuyAndSellButtonsContainerClassName,
        );

        // Create main wrapper with original layout
        const mainWrapper = document.createElement("div");
        mainWrapper.classList.add(generatedcipherBuyAndSellButtonsContainerClassName);
        Object.assign(mainWrapper.style, {
          width: "100%",
          display: "flex",
          gap: "16px",
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: "8px",
          marginBottom: "8px"
        });

        // Create Buy Container with enhanced styling
        const buyContainerWrapper = document.createElement("div");
        Object.assign(buyContainerWrapper.style, {
          flex: "1",
          padding: "16px",
          background: "linear-gradient(145deg, #1F1F1D, #121212)",
          border: "2px solid #A67A1B",
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.2)"
        });

        // Create Sell Container with enhanced styling
        const sellContainerWrapper = document.createElement("div");
        Object.assign(sellContainerWrapper.style, {
          flex: "1",
          padding: "16px",
          background: "linear-gradient(145deg, #1F1F1D, #121212)",
          border: "2px solid #A67A1B",
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.2)"
        });

        

        
        // Create Open Spots Container
        const openSpotsContainer = document.createElement("div");
        Object.assign(openSpotsContainer.style, {
          flex: "1",
          padding: "16px",
          background: "linear-gradient(145deg, #1F1F1D, #121212)",
          border: "2px solid #A67A1B",
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.2)",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "120px"
        });

        // Add Open Spots header and value
        const openSpotsHeader = document.createElement("h3");
        openSpotsHeader.textContent = "Open Spots";
        Object.assign(openSpotsHeader.style, {
          color: "white",
          fontSize: "16px",
          fontWeight: "600",
          margin: "0"
        });

        const openSpotsValue = document.createElement("div");
        openSpotsValue.textContent = "0/250";
        Object.assign(openSpotsValue.style, {
          color: "#A67A1B",
          fontSize: "24px",
          fontWeight: "bold",
          marginTop: "8px"
        });

        const disclaimerText = document.createElement("h3");
        disclaimerText.textContent = "(We are working on upgrading our servers and openning more spots, for updates follow us @CipherBot)";
        Object.assign(disclaimerText.style, {
          color: "white",
          fontSize: "12px",
          margin: "0",
          textAlign: "center"
        });

        openSpotsContainer.appendChild(openSpotsHeader);
        openSpotsContainer.appendChild(openSpotsValue);
        openSpotsContainer.appendChild(disclaimerText);

        // Create Wait List Container
        const waitListContainer = document.createElement("div");
        Object.assign(waitListContainer.style, {
          flex: "1",
          padding: "16px",
          background: "linear-gradient(145deg, #1F1F1D, #121212)",
          border: "2px solid #A67A1B",
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.2)",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "120px"
        });

        // Add Wait List header
        const waitListHeader = document.createElement("h3");
        waitListHeader.textContent = "Wait List";
        Object.assign(waitListHeader.style, {
          color: "white",
          fontSize: "16px",
          fontWeight: "600",
          margin: "0"
        });

        // Fetch wait list value using chrome.runtime.sendMessage
        chrome.runtime.sendMessage({
          type: 'fetchWaitList',
          url: 'https://api.cipherbot.tech/counter'
        }, response => {
          const waitListValue = document.createElement("div");
          waitListValue.textContent = response && response.value ? `#${response.value}` : "#--";
          Object.assign(waitListValue.style, {
            color: "#A67A1B",
            fontSize: "24px",
            fontWeight: "bold",
            marginTop: "8px"
          });
          waitListContainer.appendChild(waitListValue);
        });

        waitListContainer.appendChild(waitListHeader);

        // Add containers to main wrapper
        mainWrapper.appendChild(openSpotsContainer);
        mainWrapper.appendChild(waitListContainer);


        // Add hover effects to containers
        [openSpotsContainer, waitListContainer].forEach(container => {
          container.addEventListener("mouseenter", () => {
            container.style.transform = "translateY(-2px)";
            container.style.boxShadow = "0 6px 28px rgba(0, 0, 0, 0.3)";
          });
          
          container.addEventListener("mouseleave", () => {
            container.style.transform = "translateY(0)";
            container.style.boxShadow = "0 4px 24px rgba(0, 0, 0, 0.2)";
          });
          
          container.style.transition = "transform 0.2s ease, box-shadow 0.2s ease";
        });

        insertElementBefore(chartsContainer, mainWrapper);

        // Remove any existing chat containers
        const existingChat = document.querySelector('.cipher-chat-container');
        if (existingChat) {
          existingChat.remove();
        }

        // Create draggable chat container
        const chatContainerWrapper = document.createElement("div");
        chatContainerWrapper.classList.add('cipher-chat-container');
        const { positionKey } = getContractSpecificKeys(tokenMintAddress);

        // Create messages container
        const messagesContainer = document.createElement("div");
        Object.assign(messagesContainer.style, {
          flex: "1",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          position: "relative",
          zIndex: "1",
          padding: "16px",
          height: "calc(100% - 120px)", // Account for header and input container
          background: "rgba(18, 18, 18, 0.5)",
          backdropFilter: "blur(4px)",
          borderRadius: "8px",
          margin: "0 16px",
          scrollbarWidth: "thin",
          scrollbarColor: "#A67A1B transparent"
        });

        // Add webkit scrollbar styles
        messagesContainer.style.cssText += `
          &::-webkit-scrollbar {
            width: 8px;
          }
          &::-webkit-scrollbar-track {
            background: transparent;
          }
          &::-webkit-scrollbar-thumb {
            background-color: #A67A1B;
            border-radius: 4px;
            border: 2px solid transparent;
          }
        `;

        // Create chat input container
        const chatInputContainer = document.createElement("div");
        Object.assign(chatInputContainer.style, {
          display: "flex",
          gap: "8px",
          padding: "16px",
          position: "relative",
          zIndex: "1",
          background: "rgba(18, 18, 18, 0.5)",
          backdropFilter: "blur(4px)",
          borderRadius: "8px",
          margin: "0 16px 16px 16px"
        });

        const chatInput = document.createElement("input");
        Object.assign(chatInput.style, {
          flex: "1",
          height: "36px",
          background: "#121212",
          border: "1px solid rgb(38 40 44)",
          borderRadius: "8px",
          color: "#EDEDED",
          padding: "0 12px",
          fontSize: "12px",
          outline: "none"
        });
        chatInput.setAttribute("placeholder", "Type a message...");

        const sendButton = document.createElement("button");
        sendButton.textContent = "Send";
        Object.assign(sendButton.style, {
          padding: "0 16px",
          height: "36px",
          background: "#1F1F1D",
          border: "2px solid #A67A1B",
          borderRadius: "8px",
          color: "#EDEDED",
          cursor: "pointer",
          transition: ".2s ease-in-out"
        });

        // Add hover effects
        sendButton.addEventListener("mouseenter", () => {
          sendButton.style.background = "#A67A1B";
        });
        sendButton.addEventListener("mouseleave", () => {
          sendButton.style.background = "#1F1F1D";
        });

        // WebSocket setup
        let ws;
        let wsReconnectInterval;

        function setupWebSocket(contractAddress) {
          console.log('Setting up WebSocket for contract:', contractAddress);
          ws = new WebSocket('https://ws.cipherbot.tech');

          ws.onopen = () => {
            console.log('Connected to chat server');
            clearInterval(wsReconnectInterval);
            // Join contract-specific room and request history
            ws.send(JSON.stringify({
              type: 'join',
              contractAddress: contractAddress,
              requestHistory: true  // Add this flag
            }));
          };

          ws.onclose = () => {
            console.log('Disconnected from chat server');
            wsReconnectInterval = setInterval(() => {
              if (ws.readyState === WebSocket.CLOSED) {
                setupWebSocket(contractAddress);
              }
            }, 5000);
          };

          ws.onmessage = (event) => {
            console.log('Received message:', event.data);
            const message = JSON.parse(event.data);
            const { historyKey } = getContractSpecificKeys(contractAddress);
            
            if (message.type === 'history') {
              // Handle history messages
              chrome.storage.local.get(['cipher_chat_username'], (result) => {
                message.messages.forEach(msg => {
                  msg.isSelf = msg.username === result['cipher_chat_username'];
                  addMessageToChat(msg, messagesContainer);
                });
                
                // Store history in local storage
                chrome.storage.local.set({
                  [historyKey]: message.messages
                });
              });
            } else {
              // Handle regular messages
              chrome.storage.local.get(['cipher_chat_username'], (result) => {
                message.isSelf = message.username === result['cipher_chat_username'];
                addMessageToChat(message, messagesContainer);
                
                chrome.storage.local.get([historyKey], (result) => {
                  const history = result[historyKey] || [];
                  chrome.storage.local.set({
                    [historyKey]: [...history, message].slice(-15)
                  });
                });
              });
            }
          };
        }

        // Initialize WebSocket
        setupWebSocket(tokenMintAddress);

        // Send message handler
        sendButton.onclick = async () => {
          const message = chatInput.value.trim();
          if (message && ws.readyState === WebSocket.OPEN) {
            const { cipher_chat_username: username } = await chrome.storage.local.get(['cipher_chat_username']);
            
            const messageData = {
              type: 'message',
              content: message,
              username: username || 'Anonymous',
              timestamp: new Date().toISOString(),
              contractAddress: tokenMintAddress
            };
            
            ws.send(JSON.stringify(messageData));
            chatInput.value = '';
          }
        };

        // Enter key handler
        chatInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            sendButton.click();
          }
        });

        // Add input and button to container
        chatInputContainer.appendChild(chatInput);
        chatInputContainer.appendChild(sendButton);

        chrome.storage.local.get([positionKey], (result) => {
          const savedPosition = result[positionKey];
          Object.assign(chatContainerWrapper.style, {
            position: "fixed",
            bottom: savedPosition ? "auto" : "20px",
            right: savedPosition ? "auto" : "20px",
            left: savedPosition ? `${savedPosition.x}px` : "auto",
            top: savedPosition ? `${savedPosition.y}px` : "auto",
            width: "380px",
            height: "500px",
            background: "linear-gradient(145deg, #1F1F1D, #121212)",
            border: "2px solid #A67A1B",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            zIndex: "10000",
            cursor: "move",
            overflow: "hidden",
            boxShadow: "0 4px 24px rgba(0, 0, 0, 0.2)",
            transition: "height 0.3s ease-in-out"
          });
        });

        // Add background shapes
        const topLeftCircle = createBackgroundShape("circle");
        const bottomRightCircle = createBackgroundShape("circle");
        const centerSquare = createBackgroundShape("square");
        const topRightHexagon = createBackgroundShape("hexagon");
        const bottomLeftHexagon = createBackgroundShape("hexagon");

        Object.assign(topLeftCircle.style, {
          top: "10px",
          left: "10px"
        });

        Object.assign(bottomRightCircle.style, {
          bottom: "10px",
          right: "10px",
          animationDelay: "-4s"
        });

        Object.assign(centerSquare.style, {
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) rotate(45deg)"
        });

        Object.assign(topRightHexagon.style, {
          top: "15px",
          right: "15px",
          animationDelay: "-2s"
        });

        Object.assign(bottomLeftHexagon.style, {
          bottom: "15px",
          left: "15px",
          animationDelay: "-3s"
        });

        chatContainerWrapper.appendChild(topLeftCircle);
        chatContainerWrapper.appendChild(bottomRightCircle);
        chatContainerWrapper.appendChild(centerSquare);
        chatContainerWrapper.appendChild(topRightHexagon);
        chatContainerWrapper.appendChild(bottomLeftHexagon);

        // Add chat header
        const chatHeader = document.createElement("div");
        Object.assign(chatHeader.style, {
          padding: "12px 16px",
          color: "#EDEDED",
          fontSize: "16px",
          fontWeight: "600",
          borderBottom: "1px solid rgb(38 40 44)",
          cursor: "move",
          userSelect: "none",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "relative",
          zIndex: "1"
        });

        // Add title to header
        const chatTitle = document.createElement("span");
        chatTitle.textContent = "Chat";  // Initial text
        Object.assign(chatTitle.style, {
          color: "#EDEDED",
          fontWeight: "600",
          fontSize: "14px"
        });

        // Update title after delay
        getTickerFromPage().then(ticker => {
          chatTitle.textContent = `Chat - ${ticker}`;
        });

        chatHeader.appendChild(chatTitle);
        chatContainerWrapper.appendChild(chatHeader);
        chatContainerWrapper.appendChild(messagesContainer);
        chatContainerWrapper.appendChild(chatInputContainer);

        // Add drag functionality
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;

        chatHeader.addEventListener("mousedown", dragStart);
        document.addEventListener("mousemove", drag);
        document.addEventListener("mouseup", dragEnd);

        function dragStart(e) {
          if (e.target === chatHeader) {
            initialX = e.clientX - chatContainerWrapper.offsetLeft;
            initialY = e.clientY - chatContainerWrapper.offsetTop;
            isDragging = true;
          }
        }

        function drag(e) {
          if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            
            const maxX = window.innerWidth - chatContainerWrapper.offsetWidth;
            const maxY = window.innerHeight - chatContainerWrapper.offsetHeight;
            
            currentX = Math.min(Math.max(0, currentX), maxX);
            currentY = Math.min(Math.max(0, currentY), maxY);
            
            chatContainerWrapper.style.left = `${currentX}px`;
            chatContainerWrapper.style.top = `${currentY}px`;
          }
        }

        function dragEnd() {
          if (isDragging) {
            isDragging = false;
            chrome.storage.local.set({
              [positionKey]: { x: currentX, y: currentY }
            });
          }
        }

        // Add headers
        const buyHeader = document.createElement("h3");
        buyHeader.textContent = "Buy";
        Object.assign(buyHeader.style, {
          color: "#EDEDED",
          fontSize: "16px",
          fontWeight: "600",
          margin: "0",
          marginBottom: "8px"
        });

        const sellHeader = document.createElement("h3");
        sellHeader.textContent = "Sell";
        Object.assign(sellHeader.style, {
          color: "#EDEDED",
          fontSize: "16px",
          fontWeight: "600",
          margin: "0",
          marginBottom: "8px"
        });

        // Create button containers
        const buyButtonContainer = document.createElement("div");
        Object.assign(buyButtonContainer.style, {
          display: "flex",
          flexWrap: "wrap",
          gap: "8px"
        });

        const sellButtonContainer = document.createElement("div");
        Object.assign(sellButtonContainer.style, {
          display: "flex",
          flexWrap: "wrap",
          gap: "8px"
        });

        // Add buy buttons with click handlers
        buyButtonsList.forEach((value) => {
          const button = document.createElement("button");
          button.textContent = `${value} SOL`;
          Object.assign(button.style, {
            padding: "8px 16px",
            background: "#1F1F1D",
            border: "2px solid #A67A1B",
            borderRadius: "8px",
            color: "#EDEDED",
            cursor: "pointer"
          });

          // Add hover effects
          button.addEventListener("mouseenter", () => {
            button.style.background = "#A67A1B";
          });
          button.addEventListener("mouseleave", () => {
            button.style.background = "#1F1F1D";
          });

          // Add click handler
          button.onclick = async function() {
            button.disabled = true;
            const originalText = button.textContent;
            button.textContent = "Processing...";

            try {
              const result = await transactToken(
                tokenMintAddress,
                "buy",
                value,
                cipherAuthToken
              );

              if (result) {
                button.textContent = "Success!";
              } else {
                button.textContent = "Failed!";
              }
            } catch (error) {
              button.textContent = "Failed!";
            }

            setTimeout(() => {
              button.textContent = originalText;
              button.disabled = false;
            }, 700);
          };

          buyButtonContainer.appendChild(button);
        });

        // Add sell buttons with click handlers
        sellButtonsList.forEach((value) => {
          const button = document.createElement("button");
          button.textContent = `${value}%`;
          Object.assign(button.style, {
            padding: "8px 16px",
            background: "#1F1F1D",
            border: "2px solid #A67A1B",
            borderRadius: "8px",
            color: "#EDEDED",
            cursor: "pointer"
          });

          // Add hover effects
          button.addEventListener("mouseenter", () => {
            button.style.background = "#A67A1B";
          });
          button.addEventListener("mouseleave", () => {
            button.style.background = "#1F1F1D";
          });

          // Add click handler
          button.onclick = async function() {
            button.disabled = true;
            const originalText = button.textContent;
            button.textContent = "Processing...";

            try {
              const result = await transactToken(
                tokenMintAddress,
                "sell",
                value,
                cipherAuthToken
              );

              if (result) {
                button.textContent = "Success!";
              } else {
                button.textContent = "Failed!";
              }
            } catch (error) {
              button.textContent = "Failed!";
            }

            setTimeout(() => {
              button.textContent = originalText;
              button.disabled = false;
            }, 700);
          };

          sellButtonContainer.appendChild(button);
        });

        // Add headers to their containers
        buyContainerWrapper.appendChild(buyHeader);
        sellContainerWrapper.appendChild(sellHeader);

        // Create and setup buy field container
        const buyFieldContainer = document.createElement("div");
        Object.assign(buyFieldContainer.style, {
          boxSizing: "border-box",
          display: "flex",
          width: "100%",
          maxWidth: "300px",
          justifyContent: "center",
          background: "#121212",
          height: "36px",
          border: "1px solid rgb(38 40 44)",
          borderRadius: "8px",
          overflow: "hidden"
        });

        const buyLabelOption = document.createElement("div");
        Object.assign(buyLabelOption.style, {
          display: "flex",
          whiteSpace: "nowrap",
          background: "inherit",
          border: "none",
          height: "100%",
          padding: "0 12px",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
          fontWeight: "bold",
          fontSize: "12px",
          borderRight: "1px solid rgb(38 40 44)",
        });
        buyLabelOption.textContent = "SOL";

        const buyInput = document.createElement("input");
        Object.assign(buyInput.style, {
          width: "100%",
          height: "100%",
          background: "inherit",
          border: "none",
          outline: "none",
          color: "white",
          padding: "0 12px",
          fontSize: "12px"
        });
        buyInput.setAttribute("placeholder", elementsClassname?.container?.placeholders?.buy?.amount);

        buyFieldContainer.appendChild(buyLabelOption);
        buyFieldContainer.appendChild(buyInput);

        // Create and setup sell field container
        const sellFieldContainer = document.createElement("div");
        Object.assign(sellFieldContainer.style, {
          boxSizing: "border-box",
          display: "flex",
          width: "100%",
          maxWidth: "300px",
          justifyContent: "center",
          background: "#121212",
          height: "36px",
          border: "1px solid rgb(38 40 44)",
          borderRadius: "8px",
          overflow: "hidden"
        });

        // Add sell options container
        const sellOptionsContainer = document.createElement("div");
        Object.assign(sellOptionsContainer.style, {
          display: "flex",
          alignItems: "center",
          borderRight: "1px solid rgb(38 40 44)",
        });

        const sellInput = document.createElement("input");
        Object.assign(sellInput.style, {
          width: "100%",
          height: "100%",
          background: "inherit",
          border: "none",
          outline: "none",
          color: "white",
          padding: "0 12px",
          fontSize: "12px"
        });
        sellInput.setAttribute("placeholder", elementsClassname?.container?.placeholders?.sell?.amount);

        sellFieldContainer.appendChild(sellOptionsContainer);
        sellFieldContainer.appendChild(sellInput);

        // Move elements to their containers
        buyContainerWrapper.appendChild(buyFieldContainer);
        buyContainerWrapper.appendChild(buyButtonContainer);

        sellContainerWrapper.appendChild(sellFieldContainer);
        sellContainerWrapper.appendChild(sellButtonContainer);

        // Add containers to main wrapper
        //mainWrapper.appendChild(buyContainerWrapper);
        //mainWrapper.appendChild(sellContainerWrapper);

        // Add containers to main wrapper and body
        mainWrapper.appendChild(chatContainerWrapper);
        document.body.appendChild(chatContainerWrapper);

        // Insert after target element
        insertElementAfter(targetElement, mainWrapper);

        // Add hover effects to containers
        [buyContainerWrapper, sellContainerWrapper].forEach(container => {
          container.addEventListener("mouseenter", () => {
            container.style.transform = "translateY(-2px)";
            container.style.boxShadow = "0 6px 28px rgba(0, 0, 0, 0.3)";
          });
          
          container.addEventListener("mouseleave", () => {
            container.style.transform = "translateY(0)";
            container.style.boxShadow = "0 4px 24px rgba(0, 0, 0, 0.2)";
          });
          
          container.style.transition = "transform 0.2s ease, box-shadow 0.2s ease";
        });
      });
  } catch (error) {
    if (error?.message === "Extension context invalidated.") {
      window.location.reload();
    }
  }
};
/* const injectcipherMemescopeButtonList = () => {
  try {
    let cipherAuthToken;
    let elementsClassname;
    chrome.storage.local
      .get(["cipher_auth_token", "elements_classname"])
      .then((result) => {
        elementsClassname = result.elements_classname;
        cipherAuthToken = result.cipher_auth_token;

        const memescopeCardAddress = Array.from(
          document.querySelectorAll('div[data-sentry-component="CoinPreview"]'),
        );

        const cards = memescopeCardAddress.flatMap((link) => {
          const card = link.parentElement;
          return [card];
        });

        cards.forEach((card) => {
          const existingBuyButton = card.querySelector(
            `button.${CSS.escape(elementsClassname?.b)}`,
          );

          if (existingBuyButton) {
            existingBuyButton.remove();
          }

          const tokenMintAddress = card.getAttribute("id");

          const actionArea = card.querySelector("span.w-full");
          if (actionArea) {
          } else {
            return;
          }

          const generatedBuyButtonClassName = elementsClassname?.b;
          const buttonClass = generatedBuyButtonClassName;

          const buttonImg = document.createElement("img");
          buttonImg.src = elementsClassname?.pp;
          buttonImg.alt = "";
          buttonImg.style.aspectRatio = "1/1";
          buttonImg.style.height = "20px";
          buttonImg.style.width = "20px";
          buttonImg.style.marginRight = "6px";

          const buttonText = document.createElement("span");
          buttonText.textContent = "Buy";
          buttonText.style.fontSize = "15px";
          buttonText.style.fontWeight = "600";
          buttonText.style.letterSpacing = "0.5px";
          buttonText.style.color = "#EDEDED";

          const anotherCustomButton = document.createElement("button");
          anotherCustomButton.appendChild(buttonImg);
          anotherCustomButton.appendChild(buttonText);
          anotherCustomButton.type = "button";
          anotherCustomButton.classList.add(buttonClass);

          Object.assign(anotherCustomButton.style, {
            boxSizing: "border-box",
            width: "max-content",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "6px",
            padding: "10px 16px",
            position: "absolute",
            top: "12px",
            right: "16px",
            zIndex: "1000",
            
            background: "#1F1F1D",
            color: "#EDEDED",
            border: `2px solid #A67A1B`,
            borderRadius: "12px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            transition: "all 0.2s ease-in-out",
            cursor: "pointer",
          });

          anotherCustomButton.addEventListener("mouseenter", () => {
            anotherCustomButton.style.background = "#A67A1B";
            anotherCustomButton.style.borderColor = "#A67A1B";
            anotherCustomButton.style.transform = "translateY(-1px)";
            anotherCustomButton.style.boxShadow = "0 4px 6px rgba(0,0,0,0.25)";
          });

          anotherCustomButton.addEventListener("mouseleave", () => {
            anotherCustomButton.style.background = "#1F1F1D";
            anotherCustomButton.style.borderColor = "#A67A1B";
            anotherCustomButton.style.transform = "translateY(0)";
            anotherCustomButton.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
          });

          anotherCustomButton.addEventListener("mousedown", () => {
            anotherCustomButton.style.transform = "translateY(1px)";
            anotherCustomButton.style.boxShadow = "0 1px 2px rgba(0,0,0,0.15)";
          });

          anotherCustomButton.onclick = async function (event) {
            event.preventDefault();
            event.stopPropagation();
            anotherCustomButton.disabled = true;
            anotherCustomButton.querySelector("span").textContent =
              "Processing...";

            chrome.storage.local.get(
              ["default_buy_amount", "active_preset_values"],
              async (r) => {
                const defaultBuyAmount = r.default_buy_amount || 0.01;

                const result = await transactToken(
                  tokenMintAddress,
                  "buy",
                  defaultBuyAmount,
                  cipherAuthToken,
                  r?.active_preset_values,
                );

                if (result) {
                  anotherCustomButton.querySelector("span").textContent =
                    "Success!";
                  setTimeout(() => {
                    anotherCustomButton.querySelector("span").textContent =
                      "Buy";
                    anotherCustomButton.disabled = false;
                  }, 700);
                } else {
                  anotherCustomButton.querySelector("span").textContent =
                    "Failed!";
                  setTimeout(() => {
                    anotherCustomButton.querySelector("span").textContent =
                      "Buy";
                    anotherCustomButton.disabled = false;
                  }, 700);
                }
              },
            );
          };

          insertElementAfter(actionArea, anotherCustomButton);
        });
      });
  } catch (error) {
    if (error?.message === "Extension context invalidated.") {
      window.location.reload();
    } else {
    }
  }
}; */

let intervalId = null;

chrome.runtime.onMessage.addListener(async function (request) {
  chrome.storage.local
    .get(["is_cipher_extension_on", "elements_classname"])
    .then(async (result) => {
      const isExtensionOn = result.is_cipher_extension_on;
      const elementsClassname = result.elements_classname;

      

      if (request.message === "pumpfun-memescope") {
        const previousDraggablecipherModal = document.querySelector(
          `div.${CSS.escape(elementsClassname?.bsfm)}`,
        );
        if (previousDraggablecipherModal) {
          previousDraggablecipherModal.remove();
        }

        console.log("MESSAGE 📌: ", request.message);
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        intervalId = setInterval(() => {
          injectcipherMemescopeButtonList();
        }, 3000);

        const container = await searchAndFindTokenContainer();
        if (container) {
          injectcipherMemescopeButtonList();
          const observer = new MutationObserver(() =>
            injectcipherMemescopeButtonList(),
          );
          observer.observe(container, { childList: true });
        }
      }

      if (request.message === "pumpfun-token-save") {
        console.log("SAVE MESSAGE 📌: ", request.message);
        const currentUrl = window.location.href;
        if (currentUrl.includes("/coin")) {
          
          injectcipherContainer();
        }
      }

      if (request.message === "pumpfun-token") {
        console.log("PUMP FUN TOKEN MESSAGE 📌: ", request.message);

        const handleInjection = async () => {
          

          const chartsContainer = await searchAndFindChartsContainer();
          if (chartsContainer) {
            injectcipherContainer();
          }
        };

        handleInjection();

        let previousWidth = window.innerWidth;
        window.addEventListener("resize", async () => {
          const currentWidth = window.innerWidth;

          if (
            (previousWidth < 768 && currentWidth >= 768) ||
            (previousWidth >= 768 && currentWidth < 768)
          ) {
            handleInjection();
          }

          previousWidth = currentWidth;
        });
      }
    });
});

function addMessageToChat(message, container) {
  const messageElement = document.createElement("div");
  Object.assign(messageElement.style, {
    padding: "8px 12px",
    background: "linear-gradient(145deg, rgba(31, 31, 29, 0.9), rgba(18, 18, 18, 0.9))",
    borderRadius: "8px",
    color: "#EDEDED",
    maxWidth: "80%",
    alignSelf: message.isSelf ? "flex-end" : "flex-start",
    border: "1px solid rgba(166, 122, 27, 0.3)",
    fontSize: "12px",
    wordBreak: "break-word",
    overflowWrap: "break-word",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    backdropFilter: "blur(4px)"
  });

  const usernameSpan = document.createElement("div");
  Object.assign(usernameSpan.style, {
    fontSize: "10px",
    color: "#A67A1B",
    marginBottom: "4px"
  });
  usernameSpan.textContent = message.username;

  const contentSpan = document.createElement("div");
  Object.assign(contentSpan.style, {
    whiteSpace: "pre-wrap"
  });
  contentSpan.textContent = message.content;

  messageElement.appendChild(usernameSpan);
  messageElement.appendChild(contentSpan);
  container.appendChild(messageElement);
  container.scrollTop = container.scrollHeight;
}


const getTickerFromPage = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        const tickerElement = document.querySelector("body > main > div > div.flex.space-x-8.justify-center > div.flex.flex-col.gap-2.w-2\\/3.h-auto > div.text-sm.flex.flex-wrap.w-full.justify-between.items-center.font-normal.gap-y-\\[14px\\].gap-x-\\[0\\.5px\\].mb-1 > div > div.text-\\[\\#F8FAFC\\].text-sm.font-medium.flex-shrink-0");
        resolve(tickerElement?.textContent || "Chat");
      } catch (error) {
        console.error("Error getting ticker:", error);
        resolve("Chat");
      }
    }, 2000); // 2 seconds delay
  });
};