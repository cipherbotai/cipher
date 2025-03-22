const initDCState = async (windowId) => {
  if (!windowId) return;
  const { discord_state } = await chrome.storage.local.get("discord_state");

  const isExist = discord_state.windows.find((w) => w.windowId === windowId);
  if (!isExist) {
    await chrome.storage.local.set({
      discord_state: {
        buy_history: [...discord_state.buy_history],
        windows: [
          ...discord_state.windows,
          {
            windowId: windowId,
          },
        ],
      },
    });
  }
};

const setBuyHistory = async (history) => {
  const { discord_state } = await chrome.storage.local.get("discord_state");
  await chrome.storage.local.set({
    discord_state: {
      buy_history: [discord_state.buy_history, ...history],
    },
  });
};

const searchAndFindMainContainer = async (timeoutDuration = 20000) => {
  const interval = 1000;
  const endTime = Date.now() + timeoutDuration;

  while (Date.now() < endTime) {
    const mainContainer = document.querySelector("ol[class*='scrollerInner_']");
    if (mainContainer) return mainContainer;
    await new Promise((r) => setTimeout(r, interval));
  }

  return null;
};

const createcipherBuyButton = async (refEl, address) => {
  try {
    let cipherAuthToken;
    let elementsClassname;
    chrome.storage.local
      .get(["cipher_auth_token", "elements_classname"])
      .then((result) => {
        elementsClassname = result.elements_classname;
        cipherAuthToken = result.cipher_auth_token;

        const previousBuyButton =
          refEl.parentElement.querySelector(".cipher-buy-btn");
        if (previousBuyButton) {
          previousBuyButton.remove();
        }

        const buttonImg = document.createElement("img");
        buttonImg.src = elementsClassname?.pp;
        buttonImg.alt = "Cipher Image";
        buttonImg.style.aspectRatio = "1/1";
        buttonImg.style.height = "15px";
        buttonImg.style.width = "15px";
        buttonImg.style.marginRight = "0px";

        const buttonText = document.createElement("span");
        buttonText.textContent = "Buy";
        buttonText.style.color = "white";

        const buyButton = document.createElement("button");
        buyButton.appendChild(buttonImg);
        buyButton.appendChild(buttonText);
        buyButton.type = "button";
        buyButton.classList.add("cipher-buy-btn");
        buyButton.style.boxSizing = "border-box";
        buyButton.style.width = "max-content";
        buyButton.style.display = "flex";
        buyButton.style.justifyContent = "center";
        buyButton.style.alignItems = "center";
        buyButton.style.gap = "4px";
        buyButton.style.background = "rgba(255,255,255,0.08)";
        buyButton.style.padding = "4px 12px";
        buyButton.style.marginRight = "6px";
        buyButton.style.borderRadius = "8px";
        buyButton.style.position = "relative";
        buyButton.style.zIndex = "2";
        buyButton.style.transition = ".3 ease-in-out";
        buyButton.addEventListener("mouseenter", () => {
          buyButton.style.background = "rgba(255,255,255,0.16)";
        });
        buyButton.addEventListener("mouseleave", () => {
          buyButton.style.background = "rgba(255,255,255,0.08)";
        });

        buyButton.onclick = async function (event) {
          event.preventDefault();
          event.stopPropagation();
          buyButton.disabled = true;
          buyButton.querySelector("span").textContent = "Processing...";

          chrome.storage.local.get(
            ["default_buy_amount", "active_preset_values"],
            async (r) => {
              const defaultBuyAmount = r.default_buy_amount || 0.01;

              const result = await transactToken(
                address,
                "buy",
                defaultBuyAmount,
                cipherAuthToken,
                r?.active_preset_values,
              );

              if (result) {
                buyButton.querySelector("span").textContent = "Success!";
                setTimeout(() => {
                  buyButton.querySelector("span").textContent = "Buy";
                  buyButton.disabled = false;
                }, 700);
              } else {
                buyButton.querySelector("span").textContent = "Failed!";
                setTimeout(() => {
                  buyButton.querySelector("span").textContent = "Buy";
                  buyButton.disabled = false;
                }, 700);
              }
            },
          );
        };

        refEl.parentElement.append(buyButton);
      });
  } catch (error) {
    if (error?.message === "Extension context invalidated.") {
      window.location.reload();
    } else {
    }
  }
};

const processDiscordMessages = async () => {
  const embedElements = document.querySelectorAll(
    "article[class*='embedWrapper_']",
  );
  const normalMessages = document.querySelectorAll(
    "div[class*='contents_'] > div[class*='markup_']",
  );

  embedElements.forEach((el, i) => {
    const solanaAddressRegex = /\b[1-9A-HJ-NP-Za-km-z]{40,50}\b/g;

    const elementsToSearch = el.querySelectorAll("span, code");

    const matchingElements = [];

    elementsToSearch.forEach((childEl) => {
      const textContent = childEl.textContent || childEl.innerText;
      const matches = textContent.match(solanaAddressRegex);

      if (matches) {
        matchingElements.push(childEl);
      }
    });
    matchingElements.forEach((mE) => {
      const pureSOLAddress = addressPurifier(mE?.textContent);

      createcipherBuyButton(el, pureSOLAddress);
    });
  });
  normalMessages.forEach((el, i) => {
    const solanaAddressRegex = /\b[1-9A-HJ-NP-Za-km-z]{40,50}\b/g;

    const elementsToSearch = el.querySelectorAll("span, code");

    const matchingElements = [];

    elementsToSearch.forEach((childEl) => {
      const textContent = childEl.textContent || childEl.innerText;
      const matches = textContent.match(solanaAddressRegex);

      if (matches) {
        matchingElements.push(childEl);
      }
    });
    matchingElements.forEach((mE) => {
      const pureSOLAddress = addressPurifier(mE?.textContent);

      createcipherBuyButton(el, pureSOLAddress);
    });
  });
};

chrome.runtime.onMessage.addListener(async function (request) {
  chrome.storage.local
    .get(["is_cipher_extension_on", "elements_classname", "discord_state"])
    .then(async (result) => {
      const windowId = request.windowId;
      await initDCState(windowId);
      const isExtensionOn = result.is_cipher_extension_on;
      

      if (request.message === "discord-chatroom") {
        const mainContainer = await searchAndFindMainContainer();
        if (mainContainer) {
          await processDiscordMessages();

          const observer = new MutationObserver(async () => {
            await processDiscordMessages();
          });
          observer.observe(mainContainer, { childList: true });
        }
      }
    });
});
