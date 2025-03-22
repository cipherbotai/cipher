const CHAT_USERNAME_KEY = 'cipher_chat_username';
const CHAT_HISTORY_KEY_PREFIX = 'cipher_chat_history_';
const CHAT_POSITION_KEY_PREFIX = 'cipher_chat_position_';

function getContractSpecificKeys(contractAddress) {
  return {
    historyKey: `${CHAT_HISTORY_KEY_PREFIX}${contractAddress}`,
    positionKey: `${CHAT_POSITION_KEY_PREFIX}${contractAddress}`
  };
}

function createChatContainer() {
  const chatContainerWrapper = document.createElement("div");
  const messagesContainer = document.createElement("div");
  const chatInputContainer = document.createElement("div");

  // Set up chat container styles
  Object.assign(chatContainerWrapper.style, {
    background: `
      linear-gradient(145deg, #1F1F1D, #121212),
      radial-gradient(circle at top left, rgba(166, 122, 27, 0.1), transparent 70%),
      radial-gradient(circle at bottom right, rgba(166, 122, 27, 0.1), transparent 70%)
    `
  });

  // Add shapes to container
  chatContainerWrapper.appendChild(topLeftCircle);
  chatContainerWrapper.appendChild(bottomRightCircle);
  chatContainerWrapper.appendChild(centerSquare);
  chatContainerWrapper.appendChild(topRightHexagon);
  chatContainerWrapper.appendChild(bottomLeftHexagon);

  // Set up messages container
  Object.assign(messagesContainer.style, {
    background: "rgba(18, 18, 18, 0.85)",
    backdropFilter: "blur(12px)",
    boxShadow: "inset 0 0 20px rgba(0, 0, 0, 0.2), 0 0 10px rgba(166, 122, 27, 0.1)",
    border: "1px solid rgba(166, 122, 27, 0.3)"
  });

  // Set up input container
  Object.assign(chatInputContainer.style, {
    background: "rgba(18, 18, 18, 0.85)",
    backdropFilter: "blur(12px)",
    boxShadow: "inset 0 0 10px rgba(0, 0, 0, 0.1), 0 0 10px rgba(166, 122, 27, 0.1)",
    border: "1px solid rgba(166, 122, 27, 0.3)"
  });

  chatContainerWrapper.appendChild(messagesContainer);
  chatContainerWrapper.appendChild(chatInputContainer);
  document.body.appendChild(chatContainerWrapper);

  return {
    wrapper: chatContainerWrapper,
    messages: messagesContainer,
    input: chatInputContainer
  };
}

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

const promptForUsername = () => {
  return new Promise((resolve) => {
    const usernameModal = document.createElement("div");
    Object.assign(usernameModal.style, {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      background: "#1F1F1D",
      border: "2px solid #A67A1B",
      borderRadius: "12px",
      padding: "24px",
      zIndex: "10001",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      minWidth: "300px"
    });

    const modalTitle = document.createElement("h3");
    modalTitle.textContent = "Enter your username";
    Object.assign(modalTitle.style, {
      color: "#EDEDED",
      margin: "0",
      fontSize: "16px"
    });

    const usernameInput = document.createElement("input");
    Object.assign(usernameInput.style, {
      padding: "8px 12px",
      background: "#121212",
      border: "1px solid rgb(38 40 44)",
      borderRadius: "8px",
      color: "#EDEDED",
      outline: "none"
    });

    const submitButton = document.createElement("button");
    submitButton.textContent = "Start Chatting";
    Object.assign(submitButton.style, {
      padding: "8px 16px",
      background: "#1F1F1D",
      border: "2px solid #A67A1B",
      borderRadius: "8px",
      color: "#EDEDED",
      cursor: "pointer",
      transition: ".2s ease-in-out"
    });

    submitButton.addEventListener("mouseenter", () => {
      submitButton.style.background = "#A67A1B";
    });
    submitButton.addEventListener("mouseleave", () => {
      submitButton.style.background = "#1F1F1D";
    });

    submitButton.onclick = () => {
      const username = usernameInput.value.trim();
      if (username) {
        chrome.storage.local.set({ [CHAT_USERNAME_KEY]: username });
        usernameModal.remove();
        resolve(username);
      }
    };

    usernameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        submitButton.click();
      }
    });

    usernameModal.appendChild(modalTitle);
    usernameModal.appendChild(usernameInput);
    usernameModal.appendChild(submitButton);
    document.body.appendChild(usernameModal);
  });
};

const searchAndFindTokenContainer = async (timeoutDuration = 12000) => {
  const interval = 600;
  const endTime = Date.now() + timeoutDuration;

  while (Date.now() < endTime) {
    const lpLink = document.querySelector('a[href*="/lp/"]');
    if (lpLink) {
      const container = lpLink.closest("div")?.parentElement;
      if (container) return container;
    }
    await new Promise((r) => setTimeout(r, interval));
  }

  return null;
};
const searchAndFindTopBar = async (timeoutDuration = 12000) => {
  const interval = 600;
  const endTime = Date.now() + timeoutDuration;

  while (Date.now() < endTime) {
    const topBar = document.querySelector(".p-show__bar__row");
    if (topBar) {
      const lastDiv = topBar.querySelector(".l-col-md-auto");
      if (lastDiv) return lastDiv;
    }
    await new Promise((r) => setTimeout(r, interval));
  }

  return null;
};
const searchAndFindBuyAndSellContainer = async (timeoutDuration = 12000) => {
  const interval = 600;
  const endTime = Date.now() + timeoutDuration;

  while (Date.now() < endTime) {
    const container = document.querySelector("div.js-show__trade-tabs");
    if (container) return container;
    await new Promise((r) => setTimeout(r, interval));
  }

  return null;
};

const injectcipherSnipeButton = () => {
  try {
    let cipherAuthToken;
    let elementsClassname;
    chrome.storage.local
      .get(["cipher_auth_token", "elements_classname"])
      .then((result) => {
        elementsClassname = result.elements_classname;
        cipherAuthToken = result.cipher_auth_token;

        const migrationElement = document.querySelector(
          "div.p-show__migration",
        );
        const previousSnipingButton = document.querySelector(
          `button.${CSS.escape(elementsClassname?.sn)}`,
        );

        if (previousSnipingButton) {
          previousSnipingButton.remove();
        }

        if (migrationElement) {
          const migrationText = migrationElement.querySelector("h2");
          if (!migrationText) return;

          const tokenMintAddress = document
            .querySelector(".js-copy-to-clipboard:not(.p-show__bar__copy)")
            ?.getAttribute("data-address");
          if (!tokenMintAddress) return;

          const customButton = document.createElement("button");
          const buttonImg = document.createElement("img");
          buttonImg.src = elementsClassname?.pp;
          buttonImg.alt = "";
          buttonImg.style.aspectRatio = "1/1";
          buttonImg.style.height = "15px";
          buttonImg.style.width = "15px";
          buttonImg.style.marginRight = "5px";
          const buttonText = document.createElement("span");
          buttonText.textContent = "Snipe";

          customButton.appendChild(buttonImg);
          customButton.appendChild(buttonText);
          customButton.type = "button";
          customButton.classList.add(
            elementsClassname?.sn,
            "c-btn",
            "c-btn--lt",
          );
          customButton.style.height = "32px";
          customButton.style.padding = "0 10px";
          customButton.style.marginBottom = "12px";

          customButton.onclick = async function () {
            customButton.disabled = true;
            customButton.querySelector("span").textContent = "Processing...";

            chrome.storage.local.get("default_buy_amount", async (r) => {
              const defaultBuyAmount = r.default_buy_amount || 0.01;

              const result = await transactToken(
                tokenMintAddress,
                "snipe",
                defaultBuyAmount,
                cipherAuthToken,
                {},
              );

              if (result) {
                customButton.querySelector("span").textContent = "Success!";
                setTimeout(() => {
                  customButton.querySelector("span").textContent = "Snipe";
                  customButton.disabled = false;
                }, 700);
              } else {
                customButton.querySelector("span").textContent = "Failed!";
                setTimeout(() => {
                  customButton.querySelector("span").textContent = "Snipe";
                  customButton.disabled = false;
                }, 700);
              }
            });
          };

          insertElementBefore(migrationText, customButton);
        }
      });
  } catch (error) {}
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
        "is_buy_photon",
        "custom_buy_value_list",
        "custom_sell_value_list",
        "elements_classname",
      ])
      .then((result) => {
        elementsClassname = result.elements_classname;
        cipherAuthToken = result.cipher_auth_token;

        if (
          Array.isArray(result.custom_buy_value_list) &&
          result.custom_buy_value_list.length > 0
        ) {
          buyButtonsList = result.custom_buy_value_list;
        } else {
          buyButtonsList = [0.5, 1, 2, 5, 10];
        }
        if (
          Array.isArray(result.custom_sell_value_list) &&
          result.custom_sell_value_list.length > 0
        ) {
          sellButtonsList = result.custom_sell_value_list;
        } else {
          sellButtonsList = [10, 25, 50, 100];
        }

        const tokenMintAddress = document
          .querySelector(".js-copy-to-clipboard:not(.p-show__bar__copy)")
          ?.getAttribute("data-address");
        if (!tokenMintAddress) return;

        const previousBuyAndSellButtonsContainer = document.querySelector(
          `div.${CSS.escape(elementsClassname?.bsc)}`,
        );
        if (previousBuyAndSellButtonsContainer) {
          previousBuyAndSellButtonsContainer.remove();
        }

        const topBar = document.querySelector(".p-show__bar__row");
        if (!topBar) return;

        const placementContainer = document.querySelector(
          ".l-row.p-show__bar__row.u-align-items-center",
        );
        if (placementContainer) {
          placementContainer.classList.remove("u-align-items-center", "l-row");
          placementContainer.classList.add("u-align-items-start", "l-col");
        }
        const tokenCopyAndPairContainer = document.querySelector(
          ".l-col-md-auto.l-col-12.u-d-flex",
        );
        tokenCopyAndPairContainer.style.height = "32px";
        tokenCopyAndPairContainer.classList.add("u-align-items-center");
        const pShowBar = document.querySelector(".p-show__bar");
        pShowBar.style.padding = "12px 16px 8px 16px";
        const grandParentEl = document.querySelectorAll(
          ".l-col-lg-auto.l-col-12",
        )[1];
        grandParentEl.classList.add("u-pl-0");
        const parentEl = document.querySelector(
          ".p-show__bar__row.u-align-items-start.l-col",
        );
        parentEl.classList.add("u-pl-0");

        let isBuy = result.is_buy_photon;

        const generatedcipherBuyAndSellButtonsContainerClassName =
          elementsClassname?.bsc;
        const mainWrapper = document.createElement("div");
        mainWrapper.classList.add(generatedcipherBuyAndSellButtonsContainerClassName);
        Object.assign(mainWrapper.style, {
          width: "100%",
          display: "flex",
          gap: "16px",
          flexDirection: "row",
          justifyContent: "space-between",
          flexWrap: "wrap",
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
          minHeight: "120px",
          width: "400px"
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
          minHeight: "120px",
          width: "250px"
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

        waitListContainer.appendChild(waitListHeader);

        // Fetch wait list value
        fetch('https://api.cipherbot.tech/counter')
          .then(response => response.json())
          .then(data => {
            const waitListValue = document.createElement("div");
            waitListValue.textContent = `#${data.value}`;
            Object.assign(waitListValue.style, {
              color: "#A67A1B",
              fontSize: "24px",
              fontWeight: "bold",
              marginTop: "8px"
            });
            waitListContainer.appendChild(waitListValue);
          });

        // Add containers to main wrapper
        mainWrapper.appendChild(openSpotsContainer);
        mainWrapper.appendChild(waitListContainer);

        // Use the existing insertion method
        if (topBar) {
          insertElementAfter(topBar, mainWrapper);
        }

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

        // Create and initialize chat container
        // Create a draggable chat container
        const chatContainerWrapper = document.createElement("div");
        // Get saved position from storage
        const { positionKey } = getContractSpecificKeys(tokenMintAddress);
        chrome.storage.local.get([positionKey], (result) => {
          const savedPosition = result[positionKey];
          Object.assign(chatContainerWrapper.style, {
            position: "fixed",
            bottom: savedPosition ? "auto" : "20px",
            right: savedPosition ? "auto" : "20px",
            left: savedPosition ? `${savedPosition.x}px` : "auto",
            top: savedPosition ? `${savedPosition.y}px` : "auto",
            width: "380px",
            height: "400px",
            background: "linear-gradient(145deg, #1F1F1D, #121212)",
            border: "2px solid #A67A1B",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            padding: "16px",
            zIndex: "10000",
            cursor: "move",
            resize: "both",
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

        // Get ticker text (add this before creating chatHeader)
        const tickerElement = document.querySelector("body > div.c-body > div.p-show > div > div.l-col-12.l-col-lg-auto > div > div.p-show__widget.p-show__pair.u-py-s-lg > div.u-d-flex.u-flex-lg-column.u-justify-content-between.u-justify-content-lg-center.u-align-items-lg-center.u-align-items-start > div > div.p-show__pair__title.l-row.no-gutters.u-justify-content-center.u-d-inline-flex > div.l-col.text-ellipsis > span");
        const tickerText = tickerElement ? tickerElement.textContent.trim() : '';

        // Modify the header creation (around line 661)
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
          alignItems: "center"
        });

        const chatTitle = document.createElement("span");
        chatTitle.textContent = tickerText ? `${tickerText} Chat` : "Chat";
        Object.assign(chatTitle.style, {
          display: "flex",
          alignItems: "center",
          gap: "8px"
        });

        if (tickerText) {
          const tickerSpan = document.createElement("span");
          tickerSpan.textContent = tickerText;
          Object.assign(tickerSpan.style, {
            color: "#A67A1B",
            marginRight: "4px"
          });
          
          const chatSpan = document.createElement("span");
          chatSpan.textContent = "Chat";
          
          chatTitle.textContent = ""; // Clear the previous text
          chatTitle.appendChild(tickerSpan);
          chatTitle.appendChild(chatSpan);
        }

        chatHeader.appendChild(chatTitle);

        // Add minimize/maximize button
        const toggleButton = document.createElement("button");
        toggleButton.textContent = "×";
        Object.assign(toggleButton.style, {
          background: "none",
          border: "none",
          color: "#EDEDED",
          fontSize: "20px",
          cursor: "pointer",
          padding: "0 4px"
        });

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
          initialX = e.clientX - chatContainerWrapper.offsetLeft;
          initialY = e.clientY - chatContainerWrapper.offsetTop;
          
          if (e.target === chatHeader) {
            isDragging = true;
          }
        }

        function drag(e) {
          if (isDragging && !isMinimized) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            
            // Keep container within viewport bounds
            const maxX = window.innerWidth - chatContainerWrapper.offsetWidth;
            const maxY = window.innerHeight - chatContainerWrapper.offsetHeight;
            
            currentX = Math.min(Math.max(0, currentX), maxX);
            currentY = Math.min(Math.max(0, currentY), maxY);
            
            requestAnimationFrame(() => {
              chatContainerWrapper.style.left = currentX + "px";
              chatContainerWrapper.style.top = currentY + "px";
            });
          }
        }

        function dragEnd() {
          initialX = currentX;
          initialY = currentY;
          isDragging = false;
          
          const { positionKey } = getContractSpecificKeys(tokenMintAddress);
          chrome.storage.local.set({
            [positionKey]: {
              x: currentX,
              y: currentY
            }
          });
        }

        // Modify minimize/maximize functionality
        let isMinimized = false;
        toggleButton.addEventListener("click", () => {
          if (isMinimized) {
            chatContainerWrapper.style.height = "800px";
            messagesContainer.style.display = "flex";
            chatInputContainer.style.display = "flex";
            toggleButton.textContent = "×";
            chatHeader.style.borderBottom = "1px solid rgb(38 40 44)";
            
            setTimeout(() => {
              chatContainerWrapper.style.height = "400px";
            }, 300);
          } else {
            chatContainerWrapper.style.height = "40px";
            messagesContainer.style.display = "none";
            chatInputContainer.style.display = "none";
            toggleButton.textContent = "□";
            chatHeader.style.borderBottom = "none";
          }
          isMinimized = !isMinimized;
        });

        chatHeader.appendChild(toggleButton);

        // Create Messages Container
        const messagesContainer = document.createElement("div");
        Object.assign(messagesContainer.style, {
          flex: "1",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          padding: "8px",
          background: "rgba(18, 18, 18, 0.85)",
          backdropFilter: "blur(12px)",
          boxShadow: "inset 0 0 20px rgba(0, 0, 0, 0.2), 0 0 10px rgba(166, 122, 27, 0.1)",
          border: "1px solid rgba(166, 122, 27, 0.3)",
          borderRadius: "8px",
          position: "relative",
          zIndex: "1",
          minHeight: "0",
          scrollbarWidth: "thin",
          scrollbarColor: "#A67A1B #1F1F1D"
        });

        // Add webkit scrollbar styles for Chrome/Safari
        messagesContainer.style.cssText += `
          &::-webkit-scrollbar {
            width: 8px;
            background: #1F1F1D;
          }

          &::-webkit-scrollbar-thumb {
            background: #A67A1B;
            border-radius: 4px;
          }

          &::-webkit-scrollbar-thumb:hover {
            background: #c49322;
          }

          &::-webkit-scrollbar-track {
            background: #1F1F1D;
            border-radius: 4px;
          }
        `;

        // Load chat history
        const { historyKey } = getContractSpecificKeys(tokenMintAddress);

        chrome.storage.local.get([historyKey], (result) => {
          const history = result[historyKey] || [];
          history.forEach(message => addMessageToChat(message, messagesContainer));
        });

        // Create Input Container
        const chatInputContainer = document.createElement("div");
        Object.assign(chatInputContainer.style, {
          display: "flex",
          gap: "8px",
          padding: "8px",
          background: "rgba(18, 18, 18, 0.85)",
          backdropFilter: "blur(12px)",
          boxShadow: "inset 0 0 10px rgba(0, 0, 0, 0.1), 0 0 10px rgba(166, 122, 27, 0.1)",
          borderRadius: "8px",
          border: "1px solid rgba(166, 122, 27, 0.3)",
          position: "relative",
          zIndex: "1",
          marginTop: "8px"
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
          transition: ".2s ease-in-out",
          whiteSpace: "nowrap"
        });

        sendButton.addEventListener("mouseenter", () => {
          sendButton.style.background = "#A67A1B";
        });
        sendButton.addEventListener("mouseleave", () => {
          sendButton.style.background = "#1F1F1D";
        });

        // Modify WebSocket setup to handle reconnection
        let ws;
        let wsReconnectInterval;

        function setupWebSocket(contractAddress) {
          ws = new WebSocket('https://ws.cipherbot.tech');

          ws.onopen = () => {
            clearInterval(wsReconnectInterval);
            console.log('Connected to chat server');
            // Join contract-specific room and request history
            ws.send(JSON.stringify({
              type: 'join',
              contractAddress: contractAddress,
              requestHistory: true
            }));
          };

          ws.onclose = () => {
            wsReconnectInterval = setInterval(() => {
              if (ws.readyState === WebSocket.CLOSED) {
                setupWebSocket(contractAddress);
              }
            }, 5000);
          };

          ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            const { historyKey } = getContractSpecificKeys(contractAddress);
            
            // Handle history messages
            if (message.type === 'history') {
              chrome.storage.local.get([CHAT_USERNAME_KEY], (result) => {
                const username = result[CHAT_USERNAME_KEY];
                message.messages.forEach(msg => {
                  msg.isSelf = msg.username === username;
                  addMessageToChat(msg, messagesContainer);
                });
                
                // Store history in local storage
                chrome.storage.local.set({
                  [historyKey]: message.messages
                });
              });
              return;
            }

            // Handle regular messages
            chrome.storage.local.get([CHAT_USERNAME_KEY], (result) => {
              message.isSelf = message.username === result[CHAT_USERNAME_KEY];
              addMessageToChat(message, messagesContainer);
              
              chrome.storage.local.get([historyKey], (result) => {
                const history = result[historyKey] || [];
                chrome.storage.local.set({
                  [historyKey]: [...history, message].slice(-15)
                });
              });
            });
          };
        }

        setupWebSocket(tokenMintAddress);

        // Update send button click handler
        sendButton.onclick = async () => {
          const message = chatInput.value.trim();
          if (message && ws.readyState === WebSocket.OPEN) {
            const { [CHAT_USERNAME_KEY]: username } = await chrome.storage.local.get([CHAT_USERNAME_KEY]);
            
            if (!username) {
              const newUsername = await promptForUsername();
              if (!newUsername) return;
            }

            const messageData = {
              type: 'message',
              content: message,
              username: username || await promptForUsername(),
              timestamp: new Date().toISOString(),
              contractAddress: tokenMintAddress
            };

            ws.send(JSON.stringify(messageData));
            chatInput.value = '';
          }
        };

        chatInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            sendButton.click();
          }
        });

        // Assemble chat container
        chatInputContainer.appendChild(chatInput);
        chatInputContainer.appendChild(sendButton);

        chatContainerWrapper.appendChild(chatHeader);
        chatContainerWrapper.appendChild(messagesContainer);
        chatContainerWrapper.appendChild(chatInputContainer);

 
        mainWrapper.appendChild(chatContainerWrapper);

        // Use the existing insertion method
        if (topBar) {
          insertElementAfter(topBar, mainWrapper);
        }

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
    console.error('Error in injectcipherContainer:', error);
  }
};
const injectcipherMemescopeButtonList = () => {
  try {
    let cipherAuthToken;
    let elementsClassname;
    chrome.storage.local
      .get(["cipher_auth_token", "elements_classname"])
      .then((result) => {
        elementsClassname = result.elements_classname;
        cipherAuthToken = result.cipher_auth_token;

        const memescopeCardAddress = Array.from(
          document.querySelectorAll('a[href*="/lp/"]'),
        );

        const cards = memescopeCardAddress.flatMap((link) => {
          const card = link.closest("div");
          const isMemescopecard =
            card &&
            card.querySelector('[data-tooltip-id="tooltip-memescopecard"]');
          return isMemescopecard ? [card] : [];
        });

        cards.forEach((card) => {
          const isMigrating = Array.from(card.querySelectorAll("span")).some(
            (span) => span.textContent === "Migrating...",
          );

          const existingBuyButton = card.querySelector(
            `button.${CSS.escape(elementsClassname?.b)}`,
          );
          const existingSnipeButton = card.querySelector(
            `button.${CSS.escape(elementsClassname?.sn)}`,
          );

          if (existingBuyButton || existingSnipeButton) {
            if (isMigrating && existingBuyButton) {
              existingBuyButton.remove();
            } else if (!isMigrating && existingSnipeButton) {
              existingSnipeButton.remove();
            } else {
              return;
            }
          }

          const tokenMintAddress = card
            .querySelector(".js-copy-to-clipboard")
            ?.getAttribute("data-address");
          if (!tokenMintAddress) return;

          let actionArea = card.querySelector("button");
          if (isMigrating) {
            actionArea = Array.from(card.querySelectorAll("span")).find(
              (span) => span.textContent === "Migrating...",
            );
          }
          if (!actionArea) return;

          const generatedBuyButtonClassName = elementsClassname?.b;
          const generatedSnipeButtonClassName = elementsClassname?.sn;
          const buttonClass = isMigrating
            ? generatedSnipeButtonClassName
            : generatedBuyButtonClassName;

          const buttonImg = document.createElement("img");
          buttonImg.src = elementsClassname?.pp;
          buttonImg.alt = "";
          buttonImg.style.aspectRatio = "1/1";
          buttonImg.style.height = "15px";
          buttonImg.style.width = "15px";
          buttonImg.style.marginRight = "5px";
          const buttonText = document.createElement("span");
          buttonText.textContent = isMigrating ? "Snipe" : "Buy";
          const anotherCustomButton = document.createElement("button");

          anotherCustomButton.appendChild(buttonImg);
          anotherCustomButton.appendChild(buttonText);
          anotherCustomButton.type = "button";
          anotherCustomButton.classList.add(
            buttonClass,
            "c-btn",
            "c-btn--lt",
            "u-px-xs",
          );
          anotherCustomButton.style.bottom = "1.5px";
          anotherCustomButton.style.right = "6px";
          anotherCustomButton.style.position = "relative";
          anotherCustomButton.style.zIndex = "1000";

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
                  isMigrating ? "snipe" : "buy",
                  defaultBuyAmount,
                  cipherAuthToken,
                  isMigrating ? {} : r?.active_preset_values,
                );

                if (result) {
                  anotherCustomButton.querySelector("span").textContent =
                    "Success!";
                  setTimeout(() => {
                    anotherCustomButton.querySelector("span").textContent =
                      isMigrating ? "Snipe" : "Buy";
                    anotherCustomButton.disabled = false;
                  }, 700);
                } else {
                  anotherCustomButton.querySelector("span").textContent =
                    "Failed!";
                  setTimeout(() => {
                    anotherCustomButton.querySelector("span").textContent =
                      isMigrating ? "Snipe" : "Buy";
                    anotherCustomButton.disabled = false;
                  }, 700);
                }
              },
            );
          };

          insertElementBefore(actionArea, anotherCustomButton);
        });
      });
  } catch (error) {
    if (error?.message === "Extension context invalidated.") {
      window.location.reload();
    } else {
    }
  }
};

let intervalId = null;

chrome.runtime.onMessage.addListener(async function (request) {
  chrome.storage.local
    .get(["is_cipher_extension_on", "elements_classname"])
    .then(async (result) => {
      const isExtensionOn = result.is_cipher_extension_on;
      const elementsClassname = result.elements_classname;

      

      if (request.message === "photon-memescope") {
        const previousDraggablecipherModal = document.querySelector(
          `div.${CSS.escape(elementsClassname?.bsfm)}`,
        );
        if (previousDraggablecipherModal) {
          previousDraggablecipherModal.remove();
        }

        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        intervalId = setInterval(() => {
          //injectcipherMemescopeButtonList();
        }, 1000);

        const container = await searchAndFindTokenContainer();
        if (container) {
          //injectcipherMemescopeButtonList();
          // const observer = new MutationObserver(() =>
          //   injectcipherMemescopeButtonList(),
          // );
          observer.observe(container, { childList: true, subtree: true });
        }
      }

      if (request.message === "photon-token-save") {
        const currentUrl = window.location.href;
        if (currentUrl.includes("/en/lp/") || currentUrl.includes("/zn/lp/")) {
          
          injectcipherContainer();
        }
      }

      if (request.message === "photon-token") {
        

        const buySellContainer = await searchAndFindBuyAndSellContainer();
        if (buySellContainer) {
          //injectcipherSnipeButton();
        }
        let currentMigrating = document.querySelector("div.p-show__migration");
        if (buySellContainer) {
          const observer = new MutationObserver((mutations) => {
            if (
              mutations.every(
                (m) =>
                  m.target.nodeName &&
                  m.target.nodeName.toLowerCase() === "span",
              )
            )
              return;
            const migrating = document.querySelector("div.p-show__migration");
            if (Boolean(migrating) !== Boolean(currentMigrating)) {
              currentMigrating = migrating;
              //injectcipherSnipeButton();
            }
          });
          observer.observe(buySellContainer, {
            childList: true,
            subtree: true,
          });
        }

        const topBar = await searchAndFindTopBar();
        if (topBar) {
          injectcipherContainer();
        } else {
        }
      }
    });
});

function createBackgroundShape(type) {
  const shape = document.createElement("div");
  
  switch(type) {
    case "circle":
      Object.assign(shape.style, {
        position: "absolute",
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        background: "radial-gradient(circle at 30% 30%, #A67A1B, transparent)",
        opacity: "0.1",
        pointerEvents: "none",
        zIndex: "0",
        animation: "float 8s infinite ease-in-out"
      });
      break;
    case "square":
      Object.assign(shape.style, {
        position: "absolute",
        width: "30px",
        height: "30px",
        transform: "rotate(45deg)",
        background: "linear-gradient(45deg, #A67A1B, transparent)",
        opacity: "0.1",
        pointerEvents: "none",
        zIndex: "0",
        animation: "spin 12s infinite linear"
      });
      break;
    case "hexagon":
      Object.assign(shape.style, {
        position: "absolute",
        width: "35px",
        height: "40px",
        clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
        background: "linear-gradient(135deg, #A67A1B, transparent)",
        opacity: "0.08",
        pointerEvents: "none",
        zIndex: "0",
        animation: "pulse 6s infinite ease-in-out"
      });
      break;
  }
  return shape;
}

// Add animation styles
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes float {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-10px) rotate(5deg); }
  }
  
  @keyframes spin {
    from { transform: rotate(45deg); }
    to { transform: rotate(405deg); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.08; transform: scale(1); }
    50% { opacity: 0.12; transform: scale(1.1); }
  }
  
  @keyframes glow {
    0%, 100% { filter: brightness(1); }
    50% { filter: brightness(1.2); }
  }
`;
document.head.appendChild(styleSheet);

// Create and position more background shapes
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

// Update container styles with more visual effects
// Object.assign(chatContainerWrapper.style, {
//   background: `
//     linear-gradient(145deg, #1F1F1D, #121212),
//     radial-gradient(circle at top left, rgba(166, 122, 27, 0.1), transparent 70%),
//     radial-gradient(circle at bottom right, rgba(166, 122, 27, 0.1), transparent 70%)
//   `
// });

// Add new shapes to container
// chatContainerWrapper.appendChild(topLeftCircle);
// chatContainerWrapper.appendChild(bottomRightCircle);
// chatContainerWrapper.appendChild(centerSquare);
// chatContainerWrapper.appendChild(topRightHexagon);
// chatContainerWrapper.appendChild(bottomLeftHexagon);

// Update messages container with more depth
// Object.assign(messagesContainer.style, {
//   background: "rgba(18, 18, 18, 0.85)",
//   backdropFilter: "blur(12px)",
//   boxShadow: "inset 0 0 20px rgba(0, 0, 0, 0.2), 0 0 10px rgba(166, 122, 27, 0.1)",
//   border: "1px solid rgba(166, 122, 27, 0.3)"
// });

// Update input container with matching style
// Object.assign(chatInputContainer.style, {
//   background: "rgba(18, 18, 18, 0.85)",
//   backdropFilter: "blur(12px)",
//   boxShadow: "inset 0 0 10px rgba(0, 0, 0, 0.1), 0 0 10px rgba(166, 122, 27, 0.1)",
//   border: "1px solid rgba(166, 122, 27, 0.3)"
// });

function formatNumber(num) {
  // First round to remove decimals
  num = Math.round(num);
  
  // Format to K, M, B
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}
