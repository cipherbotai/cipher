const findAndRemoveSuspiciousDetectionModal = (selectors) => {
  const observer = new MutationObserver(() => {
    selectors.forEach((selector) => {
      const suspiciousModal = document.querySelector(selector);

      if (!suspiciousModal) return;

      suspiciousModal.style.display = "none";
      suspiciousModal.style.visibility = "hidden";
      suspiciousModal.style.opacity = "0";
      suspiciousModal.remove();
    });

    const remainingElements = selectors.some((selector) =>
      document.querySelector(selector),
    );

    if (!remainingElements) {
      observer.disconnect();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  setInterval(() => {
    selectors.forEach((selector) => {
      const suspiciousModal = document.querySelector(selector);

      if (!suspiciousModal) return;

      suspiciousModal.style.display = "none";
      suspiciousModal.style.visibility = "hidden";
      suspiciousModal.style.opacity = "0";
      suspiciousModal.remove();
    });
  }, 300);
};

const searchAndFindPumpVisionContainer = async (selector) => {
  const interval = 1000;
  const endTime = Date.now() + 12000;

  while (Date.now() < endTime) {
    const container = document.querySelector(selector);
    if (container) return container;
    await new Promise((r) => setTimeout(r, interval));
  }

  return null;
};
const searchAndFindChartsContainer = async (selector) => {
  const interval = 1000;
  const endTime = Date.now() + 20000;

  while (Date.now() < endTime) {
    const chartsContainer = document.querySelector(selector);
    if (chartsContainer) return chartsContainer;
    await new Promise((r) => setTimeout(r, interval));
  }

  return null;
};
const searchAndFindBuyAndSellContainer = async (selector) => {
  const interval = 600;
  const endTime = Date.now() + 12000;

  while (Date.now() < endTime) {
    const container = document.querySelector(selector);
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
          elementsClassname?.placement_selectors?.neobullx?.token?.snipe
            ?.migrating,
        );
        const previousSnipingButton = document.querySelector(
          `button.${CSS.escape(elementsClassname?.sn)}`,
        );

        if (previousSnipingButton) {
          previousSnipingButton.remove();
        }

        if (migrationElement) {
          const migrationText = Array.from(
            migrationElement.querySelectorAll(
              elementsClassname?.placement_selectors?.neobullx?.token?.snipe
                ?.element,
            ),
          ).filter((p) =>
            p.textContent.includes(
              elementsClassname?.placement_selectors?.neobullx?.token?.snipe
                ?.content,
            ),
          )?.[0];
          if (!migrationText) return;

          const customButton = document.createElement("button");
          const buttonText = document.createElement("span");
          buttonText.textContent = elementsClassname?.texts?.snipe;

          customButton.appendChild(buttonText);
          customButton.type = "button";
          customButton.classList.add(
            elementsClassname?.sn,
            "ant-btn",
            "ant-btn-text",
          );
          customButton.style.marginTop = "6px";
          customButton.style.marginBottom = "-24px";
          customButton.style.border = elementsClassname?.br?.b;

          customButton.onclick = async function () {
            const url = new URL(window.location.href);
            const tokenMintAddress = url.searchParams.get("address");

            chrome.storage.local.get("default_buy_amount", async (r) => {
              const defaultBuyAmount = r.default_buy_amount || 0.01;

              customButton.disabled = true;
              customButton.querySelector("span").textContent = "Processing...";
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
                  customButton.querySelector("span").textContent =
                    elementsClassname?.texts?.snipe;
                  customButton.disabled = false;
                }, 700);
              } else {
                customButton.querySelector("span").textContent = "Failed!";
                setTimeout(() => {
                  customButton.querySelector("span").textContent =
                    elementsClassname?.texts?.snipe;
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

const CHAT_USERNAME_KEY = 'cipher_chat_username';
const CHAT_HISTORY_KEY_PREFIX = 'cipher_chat_history_';
const CHAT_POSITION_KEY_PREFIX = 'cipher_chat_position_';

function getContractSpecificKeys(contractAddress) {
  return {
    historyKey: `${CHAT_HISTORY_KEY_PREFIX}${contractAddress}`,
    positionKey: `${CHAT_POSITION_KEY_PREFIX}${contractAddress}`
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

const getContractAddressFromPage = () => {
  try {
    const addressElement = document.querySelector("#root > div > div.ant-layout.site-layout.w-full.overflow-hidden.no-scrollbar.md\\:h-screen.md\\:min-h-screen.md\\:max-h-screen.md\\:ml-\\[56px\\] > main > div > div.flex.flex-col.flex-1.border.border-grey-500.rounded.w-full.no-scrollbar.bg-grey-900.md\\:overflow-y-auto > div.text-xs.flex.flex-col.md\\:flex-row.items-center.font-medium.text-left > div.flex.items-center.justify-between.py-\\[7px\\].w-full.md\\:w-auto.md\\:mt-0.md\\:border-t-0.px-2.md\\:pr-8 > div.flex.flex-col.items-end > div.flex.flex-row.items-center.space-x-1.w-full.mt-\\[2px\\].justify-end.md\\:justify-start > div > a:nth-child(2)");
    if (!addressElement?.href) return null;
    return addressElement.href.split("/").pop();
  } catch (error) {
    console.error("Error getting contract address:", error);
    return null;
  }
};

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
      cursor: "pointer"
    });

    submitButton.onclick = () => {
      const username = usernameInput.value.trim();
      if (username) {
        chrome.storage.local.set({ [CHAT_USERNAME_KEY]: username }, () => {
          usernameModal.remove();
          resolve(username);
        });
      }
    };

    usernameInput.onkeypress = (e) => {
      if (e.key === 'Enter') {
        submitButton.click();
      }
    };

    usernameModal.appendChild(modalTitle);
    usernameModal.appendChild(usernameInput);
    usernameModal.appendChild(submitButton);
    document.body.appendChild(usernameModal);
    usernameInput.focus();
  });
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
        "is_buy_neobullx",
        "custom_buy_value_list",
        "custom_sell_value_list",
        "elements_classname",
      ])
      .then((result) => {
        elementsClassname = result.elements_classname;
        cipherAuthToken = result.cipher_auth_token;

        const url = new URL(window.location.href);
        const tokenMintAddress = url.searchParams.get("address");
        
        // Now we can safely use tokenMintAddress
        const contractAddress = getContractAddressFromPage() || tokenMintAddress;

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

        const previousBuyAndSellButtonsContainer = document.querySelector(
          `div.${CSS.escape(elementsClassname?.bsc)}`,
        );
        if (previousBuyAndSellButtonsContainer) {
          previousBuyAndSellButtonsContainer.remove();
        }

        const chartsContainer = document.querySelector(
          elementsClassname?.placement_selectors?.neobullx?.token?.container,
        );
        if (!chartsContainer) {
          return;
        } else {
        }

        let isBuy = result.is_buy_neobullx;

        const generatedcipherBuyAndSellButtonsContainerClassName =
          elementsClassname?.bsc;
        const buyAndSellButtonsContainer = document.createElement("div");
        buyAndSellButtonsContainer.classList.add(
          generatedcipherBuyAndSellButtonsContainerClassName,
        );
        buyAndSellButtonsContainer.style.width = "100%";
        buyAndSellButtonsContainer.style.marginTop = "8px";
        buyAndSellButtonsContainer.style.paddingLeft = "12px";
        buyAndSellButtonsContainer.style.paddingRight = "12px";
        buyAndSellButtonsContainer.style.paddingBottom = "10px";
        buyAndSellButtonsContainer.style.display = "flex";
        buyAndSellButtonsContainer.style.flexDirection = "column";
        buyAndSellButtonsContainer.style.justifyContent = "start";
        buyAndSellButtonsContainer.style.alignItems = "start";
        buyAndSellButtonsContainer.style.gap = "12px";

        const toggleBuyOrSellButton = document.createElement("button");
        toggleBuyOrSellButton.type = "button";
        toggleBuyOrSellButton.style.padding = "8px 14px";
        toggleBuyOrSellButton.style.background = "#44103f";
        toggleBuyOrSellButton.style.border = elementsClassname?.br?.tg;
        toggleBuyOrSellButton.style.borderRadius = "8px";
        toggleBuyOrSellButton.textContent = isBuy
          ? elementsClassname?.container?.switch_btn_content?.sell
          : elementsClassname?.container?.switch_btn_content?.buy;
        toggleBuyOrSellButton.style.textWrap = "nowrap";
        toggleBuyOrSellButton.style.fontSize = "14px";
        toggleBuyOrSellButton.style.fontWeight = "600";
        toggleBuyOrSellButton.style.color = "white";
        toggleBuyOrSellButton.style.cursor = "pointer";
        toggleBuyOrSellButton.style.transition = ".2 ease-in-out";

        toggleBuyOrSellButton.addEventListener("mouseenter", () => {
          toggleBuyOrSellButton.style.background = "#5a1353";
        });
        toggleBuyOrSellButton.addEventListener("mouseleave", () => {
          toggleBuyOrSellButton.style.background = "#44103f";
        });

        toggleBuyOrSellButton.addEventListener("click", () => {
          if (buyContainer.style.display === "flex") {
            fieldContainer.replaceChild(sellOptionsContainer, buyLabelOption);
            isBuy = false;
            chrome.storage.local.set(
              {
                is_buy_neobullx: false,
              },
              () => {},
            );
            buyOrSellButton.textContent = elementsClassname?.texts?.sell;
            toggleBuyOrSellButton.textContent =
              elementsClassname?.container?.switch_btn_content?.buy;
            input.setAttribute(
              "placeholder",
              activeSellOption === "%"
                ? elementsClassname?.container?.placeholders?.sell?.percentage
                : elementsClassname?.container?.placeholders?.sell?.amount,
            );
            input.value = "";
            buyContainer.style.display = "none";
            sellContainer.style.display = "flex";
          } else {
            fieldContainer.replaceChild(buyLabelOption, sellOptionsContainer);
            isBuy = true;
            chrome.storage.local.set(
              {
                is_buy_neobullx: true,
              },
              () => {},
            );
            buyOrSellButton.textContent = elementsClassname?.texts?.buy;
            toggleBuyOrSellButton.textContent =
              elementsClassname?.container?.switch_btn_content?.sell;
            input.setAttribute(
              "placeholder",
              elementsClassname?.container?.placeholders?.buy?.amount,
            );
            input.value = "";
            buyContainer.style.display = "flex";
            sellContainer.style.display = "none";
          }
        });

        const buyContainer = document.createElement("div");
        buyContainer.style.display = isBuy ? "flex" : "none";
        buyContainer.style.justifyContent = "start";
        buyContainer.style.alignItems = "center";
        buyContainer.style.columnGap = "8px";
        buyContainer.style.rowGap = "8px";
        const sellContainer = document.createElement("div");
        sellContainer.style.display = isBuy ? "none" : "flex";
        sellContainer.style.justifyContent = "start";
        sellContainer.style.alignItems = "center";
        sellContainer.style.columnGap = "8px";
        sellContainer.style.rowGap = "8px";

        const customBuyAndSellContainer = document.createElement("div");
        customBuyAndSellContainer.style.display = "flex";
        customBuyAndSellContainer.style.justifyContent = "start";
        customBuyAndSellContainer.style.alignItems = "center";
        customBuyAndSellContainer.style.columnGap = "8px";
        customBuyAndSellContainer.style.rowGap = "8px";

        const fieldContainer = document.createElement("div");
        Object.assign(fieldContainer.style, {
          boxSizing: "border-box",
          display: "flex",
          width: "270px",
          justifyContent: "center",
          background: "rgb(13 13 16)",
          height: "36px",
          border: "1px solid rgb(86 86 86)",
          borderRadius: "8px",
          overflow: "hidden",
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
          borderRight: "1px solid rgb(86 86 86)",
        });
        buyLabelOption.textContent = elementsClassname?.texts?.sol;

        const input = document.createElement("input");

        let activeSellOption = "";
        const sellOptions = ["%", elementsClassname?.texts?.sol];
        const sellOptionsContainer = document.createElement("div");
        Object.assign(sellOptionsContainer.style, {
          display: "flex",
          alignItems: "center",
          borderRight: "1px solid rgb(86 86 86)",
        });
        const setActiveOption = (optionElement) => {
          Array.from(sellOptionsContainer.children).forEach((child) => {
            Object.assign(child.style, {
              color: "gray",
              fontWeight: "normal",
            });
          });
          Object.assign(optionElement.style, {
            color: "white",
            fontWeight: "bold",
          });
          activeSellOption = optionElement.textContent;

          input.placeholder =
            optionElement.textContent === "%"
              ? elementsClassname?.container?.placeholders?.sell?.percentage
              : elementsClassname?.container?.placeholders?.sell?.amount;
        };
        sellOptions.forEach((option, index) => {
          const sellLabelOption = document.createElement("button");
          Object.assign(sellLabelOption.style, {
            display: "flex",
            whiteSpace: "nowrap",
            background: "inherit",
            border: "none",
            height: "100%",
            padding: "0 12px",
            justifyContent: "center",
            alignItems: "center",
            color: "gray",
            fontSize: "12px",
            cursor: "pointer",
          });
          sellLabelOption.textContent = option;
          sellLabelOption.addEventListener("click", () => {
            input.value = "";
            setActiveOption(sellLabelOption);
          });
          sellOptionsContainer.appendChild(sellLabelOption);
          if (index < sellOptions.length - 1) {
            const separator = document.createElement("div");
            Object.assign(separator.style, {
              height: "50%",
              borderRight: "1px solid rgb(86 86 86)",
            });
            sellOptionsContainer.appendChild(separator);
          }
          if (index === 0) {
            setActiveOption(sellLabelOption);
          }
        });
        Object.assign(input.style, {
          width: "100%",
          height: "100%",
          borderRadius: "0.375rem",
          minWidth: "0px",
          outline: "transparent solid 2px",
          outlineOffset: "2px",
          position: "relative",
          appearance: "none",
          verticalAlign: "top",
          background: "inherit",
          textAlign: "left",
          fontSize: "12px",
          border: "none",
          outline: "none",
          color: "white",
          fontWeight: "500",
          padding: "0 12px",
        });
        input.type = "number";
        input.value = "";
        input.setAttribute("role", "spinbutton");
        input.setAttribute("autocomplete", "off");
        input.setAttribute("autocorrect", "off");
        input.setAttribute("name", elementsClassname?.customs?.bs);
        input.setAttribute(
          "placeholder",
          isBuy
            ? elementsClassname?.container?.placeholders?.buy?.amount
            : activeSellOption === "%"
              ? elementsClassname?.container?.placeholders?.sell?.percentage
              : elementsClassname?.container?.placeholders?.sell?.amount,
        );
        input.setAttribute("type", "number");
        input.setAttribute("step", "2");
        input.style.maxWidth = "100%";
        input.addEventListener("input", (e) => {
          const value = e.target.value;

          if (isBuy) {
            const isValid = /^[1-9]\d*(\.\d+)?$|^0(\.\d+)?$/.test(value);

            if (!isValid) {
              e.target.value = value.slice(0, -1);
            }
          } else {
            const isValid =
              activeSellOption === "%"
                ? /^[1-9]$|^[1-9][0-9]$|^100$/.test(value)
                : /^[1-9]\d*(\.\d+)?$|^0(\.\d+)?$/.test(value);

            if (!isValid) {
              e.target.value = value.slice(0, -1);
            }
          }
        });

        if (isBuy) {
          fieldContainer.appendChild(buyLabelOption);
          fieldContainer.appendChild(input);
        } else {
          fieldContainer.appendChild(sellOptionsContainer);
          fieldContainer.appendChild(input);
        }

        const buyOrSellButton = document.createElement("button");
        buyOrSellButton.textContent = isBuy
          ? elementsClassname?.texts?.buy
          : elementsClassname?.texts?.sell;
        buyOrSellButton.type = "button";
        buyOrSellButton.style.boxSizing = "border-box";
        buyOrSellButton.style.width = "max-content";
        buyOrSellButton.style.display = "flex";
        buyOrSellButton.style.justifyContent = "center";
        buyOrSellButton.style.alignItems = "center";
        buyOrSellButton.style.gap = "4px";
        buyOrSellButton.style.background = "rgb(44 46 51)";
        buyOrSellButton.style.padding = "6px 12px";
        buyOrSellButton.style.marginRight = "6px";
        buyOrSellButton.style.borderRadius = "8px";
        buyOrSellButton.style.border = "none";
        buyOrSellButton.style.outline = "none";
        buyOrSellButton.style.flexShrink = "0";
        buyOrSellButton.style.cursor = "pointer";
        buyOrSellButton.style.color = "white";
        buyOrSellButton.style.fontWeight = "600";
        buyOrSellButton.style.transition = ".2 ease-in-out";

        buyOrSellButton.addEventListener("mouseenter", () => {
          buyOrSellButton.style.background = "rgb(78 80 85)";
        });
        buyOrSellButton.addEventListener("mouseleave", () => {
          buyOrSellButton.style.background = "rgb(44 46 51)";
        });

        buyOrSellButton.addEventListener("click", async () => {
          const inputElement = document.querySelector(
            `[name=${elementsClassname?.customs?.bs}]`,
          );
          const buyOrSellValue = parseFloat(inputElement.value);
          buyOrSellButton.disabled = true;
          buyOrSellButton.textContent = "Processing...";

          try {
            const storageData = await new Promise((resolve, reject) => {
              chrome.storage.local.get("active_preset_values", (result) => {
                if (chrome.runtime.lastError) {
                  reject(chrome.runtime.lastError);
                } else {
                  resolve(result);
                }
              });
            });

            const result = await transactToken(
              tokenMintAddress,
              isBuy ? "buy" : "sell",
              isBuy
                ? buyOrSellValue
                : activeSellOption === "%"
                  ? buyOrSellValue
                  : null,
              cipherAuthToken,
              storageData?.active_preset_values,
              isBuy ? null : activeSellOption === "%" ? null : buyOrSellValue,
            );

            if (result) {
              buyOrSellButton.textContent = "Success!";
              setTimeout(() => {
                buyOrSellButton.textContent = isBuy
                  ? elementsClassname?.texts?.buy
                  : elementsClassname?.texts?.sell;
                buyOrSellButton.disabled = false;
              }, 700);
            } else {
              buyOrSellButton.textContent = "Failed!";
              setTimeout(() => {
                buyOrSellButton.textContent = isBuy
                  ? elementsClassname?.texts?.buy
                  : elementsClassname?.texts?.sell;
                buyOrSellButton.disabled = false;
              }, 700);
            }
          } catch (error) {
            console.error("Error accessing Chrome storage:", error);
            buyOrSellButton.textContent = "Error!";
            setTimeout(() => {
              buyOrSellButton.textContent = isBuy
                ? elementsClassname?.texts?.buy
                : elementsClassname?.texts?.sell;
              buyOrSellButton.disabled = false;
            }, 700);
          }
        });

        customBuyAndSellContainer.appendChild(fieldContainer);
        customBuyAndSellContainer.appendChild(buyOrSellButton);

        buyButtonsList.map((value) => {
          (function (buttonValue) {
            const customBuyButton = document.createElement("button");
            customBuyButton.textContent = `${elementsClassname?.texts?.buy} ${buttonValue} ${elementsClassname?.texts?.sol}`;
            customBuyButton.type = "button";
            customBuyButton.style.boxSizing = "border-box";
            customBuyButton.style.width = "max-content";
            customBuyButton.style.display = "flex";
            customBuyButton.style.justifyContent = "center";
            customBuyButton.style.alignItems = "center";
            customBuyButton.style.gap = "4px";
            customBuyButton.style.background = "rgb(44 46 51)";
            customBuyButton.style.padding = "6px 12px";
            customBuyButton.style.marginRight = "6px";
            customBuyButton.style.borderRadius = "8px";
            customBuyButton.style.border = "none";
            customBuyButton.style.outline = "none";
            customBuyButton.style.cursor = "pointer";
            customBuyButton.style.fontWeight = "600";
            customBuyButton.style.color = "white";
            customBuyButton.style.transition = ".2 ease-in-out";
            customBuyButton.addEventListener("mouseenter", () => {
              customBuyButton.style.background = "rgb(78 80 85)";
            });
            customBuyButton.addEventListener("mouseleave", () => {
              customBuyButton.style.background = "rgb(44 46 51)";
            });

            customBuyButton.onclick = async function () {
              customBuyButton.disabled = true;
              customBuyButton.textContent = "Processing...";

              try {
                const storageData = await new Promise((resolve, reject) => {
                  chrome.storage.local.get("active_preset_values", (result) => {
                    if (chrome.runtime.lastError) {
                      reject(chrome.runtime.lastError);
                    } else {
                      resolve(result);
                    }
                  });
                });

                const result = await transactToken(
                  tokenMintAddress,
                  "buy",
                  buttonValue,
                  cipherAuthToken,
                  storageData?.active_preset_values,
                );

                if (result) {
                  customBuyButton.textContent = "Success!";
                  setTimeout(() => {
                    customBuyButton.disabled = false;
                    customBuyButton.textContent = `${elementsClassname?.texts?.buy} ${buttonValue} ${elementsClassname?.texts?.sol}`;
                  }, 700);
                } else {
                  customBuyButton.textContent = "Failed!";
                  setTimeout(() => {
                    customBuyButton.disabled = false;
                    customBuyButton.textContent = `${elementsClassname?.texts?.buy} ${buttonValue} ${elementsClassname?.texts?.sol}`;
                  }, 700);
                }
              } catch (error) {
                console.error("Error accessing Chrome storage:", error);
                customBuyButton.textContent = "Error!";
                setTimeout(() => {
                  customBuyButton.disabled = false;
                  customBuyButton.textContent = `${elementsClassname?.texts?.buy} ${buttonValue} ${elementsClassname?.texts?.sol}`;
                }, 700);
              }
            };

            buyContainer.append(customBuyButton);
          })(value);
        });
        sellButtonsList.map((value) => {
          (function (buttonValue) {
            const customSellButton = document.createElement("button");
            customSellButton.textContent = `${elementsClassname?.texts?.sell} ${buttonValue}%`;
            customSellButton.type = "button";
            customSellButton.style.boxSizing = "border-box";
            customSellButton.style.width = "max-content";
            customSellButton.style.display = "flex";
            customSellButton.style.justifyContent = "center";
            customSellButton.style.alignItems = "center";
            customSellButton.style.gap = "4px";
            customSellButton.style.background = "rgb(44 46 51)";
            customSellButton.style.padding = "6px 12px";
            customSellButton.style.marginRight = "6px";
            customSellButton.style.borderRadius = "8px";
            customSellButton.style.border = "none";
            customSellButton.style.outline = "none";
            customSellButton.style.cursor = "pointer";
            customSellButton.style.fontWeight = "600";
            customSellButton.style.color = "white";
            customSellButton.style.transition = ".2 ease-in-out";
            customSellButton.addEventListener("mouseenter", () => {
              customSellButton.style.background = "rgb(78 80 85)";
            });
            customSellButton.addEventListener("mouseleave", () => {
              customSellButton.style.background = "rgb(44 46 51)";
            });

            customSellButton.onclick = async function () {
              customSellButton.disabled = true;
              customSellButton.textContent = "Processing...";

              try {
                const storageData = await new Promise((resolve, reject) => {
                  chrome.storage.local.get("active_preset_values", (result) => {
                    if (chrome.runtime.lastError) {
                      reject(chrome.runtime.lastError);
                    } else {
                      resolve(result);
                    }
                  });
                });

                const result = await transactToken(
                  tokenMintAddress,
                  "sell",
                  buttonValue,
                  cipherAuthToken,
                  storageData?.active_preset_values,
                );

                if (result) {
                  customSellButton.textContent = "Success!";
                  setTimeout(() => {
                    customSellButton.disabled = false;
                    customSellButton.textContent = `${elementsClassname?.texts?.sell} ${buttonValue}%`;
                  }, 700);
                } else {
                  customSellButton.textContent = "Failed!";
                  setTimeout(() => {
                    customSellButton.disabled = false;
                    customSellButton.textContent = `${elementsClassname?.texts?.sell} ${buttonValue}%`;
                  }, 700);
                }
              } catch (error) {
                console.error("Error accessing Chrome storage:", error);
                customSellButton.textContent = "Error!";
                setTimeout(() => {
                  customSellButton.disabled = false;
                  customSellButton.textContent = `${elementsClassname?.texts?.sell} ${buttonValue}%`;
                }, 700);
              }
            };

            sellContainer.append(customSellButton);
          })(value);
        });

        const buyAndSellWrapper = document.createElement("div");
        buyAndSellWrapper.style.display = "flex";
        buyAndSellWrapper.style.gap = "8px";
        const customBuyAndSellWithToggleWrapper = document.createElement("div");
        customBuyAndSellWithToggleWrapper.style.display = "flex";
        customBuyAndSellWithToggleWrapper.style.gap = "8px";

        buyAndSellWrapper.append(buyContainer);
        buyAndSellWrapper.append(sellContainer);
        buyAndSellButtonsContainer.append(buyAndSellWrapper);

        customBuyAndSellWithToggleWrapper.append(customBuyAndSellContainer);
        customBuyAndSellWithToggleWrapper.append(toggleBuyOrSellButton);
        buyAndSellButtonsContainer.append(customBuyAndSellWithToggleWrapper);

        
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

        // Create chat container
        const chatContainerWrapper = document.createElement("div");
        chatContainerWrapper.classList.add('cipher-chat-container');
        Object.assign(chatContainerWrapper.style, {
          position: "fixed",
          width: "380px",
          height: "500px",
          background: "linear-gradient(145deg, #1F1F1D, #121212)",
          border: "2px solid #A67A1B",
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          zIndex: "10000",
          overflow: "hidden",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.2)"
        });

        // Load saved position or set initial position
        const { positionKey } = getContractSpecificKeys(contractAddress);
        chrome.storage.local.get([positionKey], (result) => {
          const savedPosition = result[positionKey];
          if (savedPosition) {
            currentX = savedPosition.x;
            currentY = savedPosition.y;
          } else {
            // Set initial position relative to viewport
            currentX = window.innerWidth - 400; // 20px margin from right
            currentY = window.innerHeight - 520; // 20px margin from bottom
          }
          
          // Apply position
          chatContainerWrapper.style.left = currentX + "px";
          chatContainerWrapper.style.top = currentY + "px";
        });

        // Create header
        const chatHeader = document.createElement("div");
        Object.assign(chatHeader.style, {
          padding: "12px 16px",
          background: "rgba(31, 31, 29, 0.95)",
          borderBottom: "1px solid rgba(166, 122, 27, 0.3)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "move",
          userSelect: "none"
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

        // Add minimize button
        const minimizeButton = document.createElement("button");
        minimizeButton.textContent = "−";
        Object.assign(minimizeButton.style, {
          background: "none",
          border: "none",
          color: "#EDEDED",
          fontSize: "20px",
          cursor: "pointer",
          padding: "0 4px"
        });

        // Make container draggable
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;

        chatHeader.addEventListener("mousedown", (e) => {
          isDragging = true;
          initialX = e.clientX - currentX;
          initialY = e.clientY - currentY;
        });

        document.addEventListener("mousemove", (e) => {
          if (!isDragging) return;

          e.preventDefault();
          currentX = e.clientX - initialX;
          currentY = e.clientY - initialY;

          chatContainerWrapper.style.left = currentX + "px";
          chatContainerWrapper.style.top = currentY + "px";
        });

        document.addEventListener("mouseup", () => {
          if (isDragging) {
            isDragging = false;
            // Save position
            const { positionKey } = getContractSpecificKeys(contractAddress);
            chrome.storage.local.set({
              [positionKey]: { x: currentX, y: currentY }
            });
          }
        });

        // Add minimize/maximize functionality
        let isMinimized = false;
        const originalHeight = chatContainerWrapper.style.height;
        minimizeButton.addEventListener("click", () => {
          if (isMinimized) {
            chatContainerWrapper.style.height = originalHeight;
            messagesContainer.style.display = "flex";
            chatInputContainer.style.display = "flex";
            minimizeButton.textContent = "−";
          } else {
            chatContainerWrapper.style.height = "auto";
            messagesContainer.style.display = "none";
            chatInputContainer.style.display = "none";
            minimizeButton.textContent = "+";
          }
          isMinimized = !isMinimized;
        });

        // Assemble header
        chatHeader.appendChild(chatTitle);
        chatHeader.appendChild(minimizeButton);

        // Add header to container before other elements
        chatContainerWrapper.insertBefore(chatHeader, chatContainerWrapper.firstChild);

        // Update container style for dragging
        Object.assign(chatContainerWrapper.style, {
          position: "fixed",
          cursor: "auto"
        });

        // Create messages container
        const messagesContainer = document.createElement("div");
        Object.assign(messagesContainer.style, {
          flex: "1",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          padding: "16px",
          background: "rgba(18, 18, 18, 0.85)",
          backdropFilter: "blur(12px)",
          boxShadow: "inset 0 0 20px rgba(0, 0, 0, 0.2), 0 0 10px rgba(166, 122, 27, 0.1)",
          border: "1px solid rgba(166, 122, 27, 0.3)",
          transition: "all 0.3s ease"
        });

        // Add custom scrollbar styles if not already present
        if (!document.getElementById('cipher-scrollbar-style')) {
          const scrollbarStyle = document.createElement('style');
          scrollbarStyle.id = 'cipher-scrollbar-style';
          scrollbarStyle.textContent = `
            .cipher-chat-container *::-webkit-scrollbar {
              width: 8px;
              height: 8px;
            }
            
            .cipher-chat-container *::-webkit-scrollbar-track {
              background: rgba(18, 18, 18, 0.85);
              border-radius: 4px;
            }
            
            .cipher-chat-container *::-webkit-scrollbar-thumb {
              background: rgba(166, 122, 27, 0.5);
              border-radius: 4px;
              transition: background 0.2s ease;
            }
            
            .cipher-chat-container *::-webkit-scrollbar-thumb:hover {
              background: rgba(166, 122, 27, 0.8);
            }
            
            .cipher-chat-container *::-webkit-scrollbar-corner {
              background: transparent;
            }
          `;
          document.head.appendChild(scrollbarStyle);
        }

        // Add the scrollbar class to the messages container
        messagesContainer.classList.add('cipher-chat-container');

        // Create input container
        const chatInputContainer = document.createElement("div");
        Object.assign(chatInputContainer.style, {
          display: "flex",
          gap: "8px",
          padding: "16px",
          background: "rgba(18, 18, 18, 0.85)",
          backdropFilter: "blur(12px)",
          boxShadow: "inset 0 0 10px rgba(0, 0, 0, 0.1)",
          border: "1px solid rgba(166, 122, 27, 0.3)"
        });

        const chatInput = document.createElement("input");
        Object.assign(chatInput.style, {
          flex: "1",
          padding: "8px 12px",
          background: "#121212",
          border: "1px solid rgb(38 40 44)",
          borderRadius: "8px",
          color: "#EDEDED",
          outline: "none"
        });
        chatInput.setAttribute("placeholder", "Type a message...");

        const sendButton = document.createElement("button");
        sendButton.textContent = "Send";
        Object.assign(sendButton.style, {
          padding: "8px 16px",
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

        // Add components to containers
        chatInputContainer.appendChild(chatInput);
        chatInputContainer.appendChild(sendButton);
        chatContainerWrapper.appendChild(messagesContainer);
        chatContainerWrapper.appendChild(chatInputContainer);

        // Add chat container to document
        document.body.appendChild(chatContainerWrapper);

        // WebSocket setup
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
              requestHistory: true  // Add this flag to request history
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

        setupWebSocket(contractAddress);

        // Update send button click handler
        sendButton.onclick = async () => {
          const message = chatInput.value.trim();
          if (!message) return;

          try {
            const result = await chrome.storage.local.get([CHAT_USERNAME_KEY]);
            let username = result[CHAT_USERNAME_KEY];
            
            if (!username) {
              username = await promptForUsername();
            }

            if (ws.readyState === WebSocket.OPEN) {
              const messageData = {
                type: 'message',
                content: message,
                username: username,
                timestamp: new Date().toISOString(),
                contractAddress: contractAddress
              };
              
              ws.send(JSON.stringify(messageData));
              chatInput.value = '';
            } else {
              console.log('WebSocket is not connected. Attempting to reconnect...');
              setupWebSocket(contractAddress);
            }
          } catch (error) {
            console.error('Error sending message:', error);
          }
        };

        // Add Enter key handler for the input
        chatInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            sendButton.click();
          }
        });

        // Add advanced trading options panel
        const addAdvancedTradingPanel = () => {
          const existingPanel = document.querySelector('.cipher-advanced-trading-panel');
          if (existingPanel) return;
          
          const contractAddress = getContractAddressFromPage();
          if (!contractAddress) return;
          
          const chartsContainerSelector = elementsClassname?.placement_selectors?.neobullx?.token?.charts?.container;
          if (!chartsContainerSelector) return;
          
          const chartsContainer = document.querySelector(chartsContainerSelector);
          if (!chartsContainer) return;
          
          // Create the panel container
          const advancedPanel = document.createElement('div');
          advancedPanel.className = 'cipher-advanced-trading-panel';
          advancedPanel.style.cssText = `
            background: rgba(30, 30, 40, 0.95);
            border: 1px solid #3a3a4a;
            border-radius: 8px;
            padding: 15px;
            margin-top: 20px;
            color: #f0f0f0;
            font-family: 'Inter', sans-serif;
          `;
          
          // Create tabs for different functionalities
          const tabsContainer = document.createElement('div');
          tabsContainer.className = 'cipher-tabs';
          tabsContainer.style.cssText = `
            display: flex;
            border-bottom: 1px solid #3a3a4a;
            margin-bottom: 15px;
          `;
          
          const createTab = (label, id, isActive = false) => {
            const tab = document.createElement('div');
            tab.textContent = label;
            tab.dataset.tabId = id;
            tab.className = `cipher-tab ${isActive ? 'active' : ''}`;
            tab.style.cssText = `
              padding: 8px 15px;
              cursor: pointer;
              user-select: none;
              ${isActive ? 'border-bottom: 2px solid #6677ff; color: #6677ff;' : ''}
            `;
            
            tab.addEventListener('click', () => {
              document.querySelectorAll('.cipher-tab').forEach(t => {
                t.style.borderBottom = '';
                t.style.color = '';
                t.classList.remove('active');
              });
              
              tab.style.borderBottom = '2px solid #6677ff';
              tab.style.color = '#6677ff';
              tab.classList.add('active');
              
              document.querySelectorAll('.cipher-tab-content').forEach(c => {
                c.style.display = 'none';
              });
              
              const content = document.querySelector(`.cipher-tab-content[data-tab-id="${id}"]`);
              if (content) content.style.display = 'block';
            });
            
            return tab;
          };
          
          // Create tabs
          const aiTab = createTab('AI Trading', 'ai-trading', true);
          const limitOrdersTab = createTab('Limit Orders', 'limit-orders');
          
          tabsContainer.appendChild(aiTab);
          tabsContainer.appendChild(limitOrdersTab);
          advancedPanel.appendChild(tabsContainer);
          
          // Add AI Trading tab content
          const aiContent = document.createElement('div');
          aiContent.className = 'cipher-tab-content';
          aiContent.dataset.tabId = 'ai-trading';
          aiContent.style.display = 'block';
          
          const aiHeaderContainer = document.createElement('div');
          aiHeaderContainer.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
          `;
          
          const aiHeader = document.createElement('h3');
          aiHeader.textContent = 'AI Trading Assistant';
          aiHeader.style.margin = '0';
          
          const aiToggle = document.createElement('label');
          aiToggle.className = 'cipher-toggle';
          aiToggle.style.cssText = `
            display: inline-block;
            position: relative;
            width: 50px;
            height: 24px;
          `;
          
          const aiToggleInput = document.createElement('input');
          aiToggleInput.type = 'checkbox';
          aiToggleInput.style.opacity = '0';
          aiToggleInput.style.width = '0';
          aiToggleInput.style.height = '0';
          
          const aiToggleSlider = document.createElement('span');
          aiToggleSlider.style.cssText = `
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #333;
            transition: .4s;
            border-radius: 24px;
          `;
          
          aiToggleSlider.innerHTML = `<span style="
            position: absolute;
            content: "";
            height: 18px;
            width: 18px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
          "></span>`;
          
          aiToggle.appendChild(aiToggleInput);
          aiToggle.appendChild(aiToggleSlider);
          
          aiHeaderContainer.appendChild(aiHeader);
          aiHeaderContainer.appendChild(aiToggle);
          aiContent.appendChild(aiHeaderContainer);
          
          // AI Trading content
          const aiPredictionContainer = document.createElement('div');
          aiPredictionContainer.className = 'cipher-ai-prediction';
          aiPredictionContainer.style.cssText = `
            background: rgba(20, 20, 30, 0.5);
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 15px;
          `;
          
          const aiPredictionTitle = document.createElement('div');
          aiPredictionTitle.textContent = 'Market Prediction';
          aiPredictionTitle.style.cssText = `
            font-weight: 600;
            margin-bottom: 10px;
            color: #6677ff;
          `;
          
          const aiPredictionContent = document.createElement('div');
          aiPredictionContent.innerHTML = `<div style="text-align: center; padding: 15px;">
            <span style="color: #999;">Click Analyze to generate AI prediction</span>
          </div>`;
          
          aiPredictionContainer.appendChild(aiPredictionTitle);
          aiPredictionContainer.appendChild(aiPredictionContent);
          aiContent.appendChild(aiPredictionContainer);
          
          // Actions buttons
          const aiActionsContainer = document.createElement('div');
          aiActionsContainer.style.cssText = `
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
          `;
          
          const analyzeButton = document.createElement('button');
          analyzeButton.textContent = 'Analyze';
          analyzeButton.style.cssText = `
            background: #6677ff;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 8px 16px;
            font-weight: 600;
            cursor: pointer;
            flex: 1;
          `;
          
          const autoTradeButton = document.createElement('button');
          autoTradeButton.textContent = 'Auto Trade';
          autoTradeButton.style.cssText = `
            background: #333;
            color: white;
            border: 1px solid #6677ff;
            border-radius: 6px;
            padding: 8px 16px;
            font-weight: 600;
            cursor: pointer;
            flex: 1;
          `;
          
          aiActionsContainer.appendChild(analyzeButton);
          aiActionsContainer.appendChild(autoTradeButton);
          aiContent.appendChild(aiActionsContainer);
          
          // AI settings
          const aiSettingsContainer = document.createElement('div');
          aiSettingsContainer.style.cssText = `
            background: rgba(20, 20, 30, 0.5);
            border-radius: 6px;
            padding: 12px;
          `;
          
          const aiSettingsTitle = document.createElement('div');
          aiSettingsTitle.textContent = 'AI Settings';
          aiSettingsTitle.style.cssText = `
            font-weight: 600;
            margin-bottom: 10px;
            color: #6677ff;
          `;
          
          const aiSettingsContent = document.createElement('div');
          aiSettingsContent.style.cssText = `
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          `;
          
          // Helper function to create a setting row
          const createSettingRow = (label, value, min, max, step) => {
            const row = document.createElement('div');
            row.style.cssText = `
              display: flex;
              flex-direction: column;
              gap: 5px;
            `;
            
            const labelEl = document.createElement('label');
            labelEl.textContent = label;
            labelEl.style.fontSize = '12px';
            
            const inputContainer = document.createElement('div');
            inputContainer.style.cssText = `
              display: flex;
              gap: 8px;
              align-items: center;
            `;
            
            const input = document.createElement('input');
            input.type = 'range';
            input.min = min;
            input.max = max;
            input.step = step;
            input.value = value;
            input.style.flex = '1';
            
            const valueDisplay = document.createElement('span');
            valueDisplay.textContent = value;
            valueDisplay.style.minWidth = '40px';
            valueDisplay.style.textAlign = 'right';
            
            input.addEventListener('input', () => {
              valueDisplay.textContent = input.value;
            });
            
            inputContainer.appendChild(input);
            inputContainer.appendChild(valueDisplay);
            
            row.appendChild(labelEl);
            row.appendChild(inputContainer);
            
            return row;
          };
          
          // Add settings rows
          aiSettingsContent.appendChild(createSettingRow('Confidence Threshold', '0.75', '0.5', '0.95', '0.05'));
          aiSettingsContent.appendChild(createSettingRow('Max Investment (SOL)', '0.1', '0.01', '1', '0.01'));
          aiSettingsContent.appendChild(createSettingRow('Stop Loss %', '5', '1', '15', '1'));
          aiSettingsContent.appendChild(createSettingRow('Take Profit %', '15', '5', '50', '1'));
          
          aiSettingsContainer.appendChild(aiSettingsTitle);
          aiSettingsContainer.appendChild(aiSettingsContent);
          aiContent.appendChild(aiSettingsContainer);
          
          // Limit Orders tab content
          const limitOrdersContent = document.createElement('div');
          limitOrdersContent.className = 'cipher-tab-content';
          limitOrdersContent.dataset.tabId = 'limit-orders';
          limitOrdersContent.style.display = 'none';
          
          // Limit Orders header
          const limitOrdersHeader = document.createElement('div');
          limitOrdersHeader.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
          `;
          
          const limitOrdersTitle = document.createElement('h3');
          limitOrdersTitle.textContent = 'Advanced Limit Orders';
          limitOrdersTitle.style.margin = '0';
          
          limitOrdersHeader.appendChild(limitOrdersTitle);
          limitOrdersContent.appendChild(limitOrdersHeader);
          
          // Create new order form
          const newOrderForm = document.createElement('div');
          newOrderForm.style.cssText = `
            background: rgba(20, 20, 30, 0.5);
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 15px;
          `;
          
          const newOrderTitle = document.createElement('div');
          newOrderTitle.textContent = 'Create New Order';
          newOrderTitle.style.cssText = `
            font-weight: 600;
            margin-bottom: 10px;
            color: #6677ff;
          `;
          
          const formGrid = document.createElement('div');
          formGrid.style.cssText = `
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
          `;
          
          // Helper function to create a form group
          const createFormGroup = (label, type, options = []) => {
            const group = document.createElement('div');
            group.style.cssText = `
              display: flex;
              flex-direction: column;
              gap: 5px;
            `;
            
            const labelEl = document.createElement('label');
            labelEl.textContent = label;
            labelEl.style.fontSize = '12px';
            
            let inputEl;
            
            if (type === 'select') {
              inputEl = document.createElement('select');
              inputEl.style.cssText = `
                background: #222;
                color: white;
                border: 1px solid #444;
                border-radius: 4px;
                padding: 6px;
              `;
              
              options.forEach(option => {
                const optionEl = document.createElement('option');
                optionEl.value = option.value;
                optionEl.textContent = option.label;
                inputEl.appendChild(optionEl);
              });
            } else {
              inputEl = document.createElement('input');
              inputEl.type = type;
              inputEl.style.cssText = `
                background: #222;
                color: white;
                border: 1px solid #444;
                border-radius: 4px;
                padding: 6px;
              `;
            }
            
            group.appendChild(labelEl);
            group.appendChild(inputEl);
            
            return group;
          };
          
          // Add form groups
          formGrid.appendChild(createFormGroup('Order Type', 'select', [
            { value: 'LIMIT_BUY', label: 'Limit Buy' },
            { value: 'LIMIT_SELL', label: 'Limit Sell' },
            { value: 'STOP_LOSS', label: 'Stop Loss' },
            { value: 'TAKE_PROFIT', label: 'Take Profit' },
            { value: 'TRAILING_STOP', label: 'Trailing Stop' }
          ]));
          
          formGrid.appendChild(createFormGroup('Amount (SOL)', 'number'));
          formGrid.appendChild(createFormGroup('Price', 'number'));
          formGrid.appendChild(createFormGroup('Slippage %', 'number'));
          
          // Create order button
          const createOrderButton = document.createElement('button');
          createOrderButton.textContent = 'Create Order';
          createOrderButton.style.cssText = `
            background: #6677ff;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 8px 16px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
          `;
          
          newOrderForm.appendChild(newOrderTitle);
          newOrderForm.appendChild(formGrid);
          newOrderForm.appendChild(createOrderButton);
          limitOrdersContent.appendChild(newOrderForm);
          
          // Active orders list
          const activeOrdersList = document.createElement('div');
          activeOrdersList.style.cssText = `
            background: rgba(20, 20, 30, 0.5);
            border-radius: 6px;
            padding: 12px;
          `;
          
          const activeOrdersTitle = document.createElement('div');
          activeOrdersTitle.textContent = 'Active Orders';
          activeOrdersTitle.style.cssText = `
            font-weight: 600;
            margin-bottom: 10px;
            color: #6677ff;
            display: flex;
            justify-content: space-between;
            align-items: center;
          `;
          
          const refreshButton = document.createElement('button');
          refreshButton.innerHTML = '&#x21bb;'; // Refresh icon
          refreshButton.style.cssText = `
            background: none;
            border: none;
            color: #6677ff;
            cursor: pointer;
            font-size: 16px;
          `;
          
          activeOrdersTitle.appendChild(refreshButton);
          
          const ordersTable = document.createElement('table');
          ordersTable.style.cssText = `
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          `;
          
          ordersTable.innerHTML = `
            <thead>
              <tr style="border-bottom: 1px solid #444;">
                <th style="text-align: left; padding: 6px;">Type</th>
                <th style="text-align: right; padding: 6px;">Price</th>
                <th style="text-align: right; padding: 6px;">Amount</th>
                <th style="text-align: right; padding: 6px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #333;">
                <td colspan="4" style="text-align: center; padding: 10px;">No active orders</td>
              </tr>
            </tbody>
          `;
          
          activeOrdersList.appendChild(activeOrdersTitle);
          activeOrdersList.appendChild(ordersTable);
          limitOrdersContent.appendChild(activeOrdersList);
          
          // Add tab contents to panel
          advancedPanel.appendChild(aiContent);
          advancedPanel.appendChild(limitOrdersContent);
          
          // Add event listeners
          analyzeButton.addEventListener('click', async () => {
            // Show loading state
            aiPredictionContent.innerHTML = `<div style="text-align: center; padding: 15px;">
              <span>Analyzing market data...</span>
            </div>`;
            
            try {
              // Generate AI prediction
              chrome.runtime.sendMessage(
                {
                  context: "get_ai_prediction",
                  tokenMint: contractAddress
                },
                response => {
                  if (response && response.success && response.signal) {
                    const signal = response.signal;
                    
                    // Determine signal color
                    let signalColor;
                    let directionArrow;
                    
                    switch (signal.signal) {
                      case 'strong_buy':
                        signalColor = '#00cc44';
                        directionArrow = '↑↑';
                        break;
                      case 'buy':
                        signalColor = '#00aa44';
                        directionArrow = '↑';
                        break;
                      case 'neutral':
                        signalColor = '#cccccc';
                        directionArrow = '→';
                        break;
                      case 'sell':
                        signalColor = '#ff6666';
                        directionArrow = '↓';
                        break;
                      case 'strong_sell':
                        signalColor = '#ff3333';
                        directionArrow = '↓↓';
                        break;
                      default:
                        signalColor = '#999999';
                        directionArrow = '?';
                    }
                    
                    // Format prediction display
                    aiPredictionContent.innerHTML = `
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div>
                          <div style="font-size: 14px; font-weight: 600; color: ${signalColor};">
                            ${signal.signal.toUpperCase().replace('_', ' ')} ${directionArrow}
                          </div>
                          <div style="font-size: 12px; color: #aaa;">
                            Confidence: ${(signal.confidence * 100).toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div style="font-size: 14px; font-weight: 600;">
                            Target: ${signal.targetPrice} SOL
                          </div>
                          <div style="font-size: 12px; color: #aaa;">
                            Time Horizon: ${signal.timeHorizon}
                          </div>
                        </div>
                      </div>
                      
                      <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 5px; font-size: 11px;">
                        ${Object.entries(signal.analysisFactors).map(([factor, value]) => `
                          <div style="text-align: center;">
                            <div style="color: #999;">${factor.charAt(0).toUpperCase() + factor.slice(1)}</div>
                            <div style="font-weight: 600;">${value.toFixed(2)}</div>
                          </div>
                        `).join('')}
                      </div>
                    `;
                    
                    // Enable auto trade button if signal is actionable
                    if (['strong_buy', 'buy', 'strong_sell', 'sell'].includes(signal.signal)) {
                      autoTradeButton.style.background = '#6677ff';
                      autoTradeButton.style.color = 'white';
                    } else {
                      autoTradeButton.style.background = '#333';
                      autoTradeButton.style.color = '#999';
                    }
                    
                  } else {
                    aiPredictionContent.innerHTML = `<div style="text-align: center; padding: 15px;">
                      <span style="color: #ff6666;">Error: Could not generate prediction</span>
                    </div>`;
                  }
                }
              );
            } catch (error) {
              aiPredictionContent.innerHTML = `<div style="text-align: center; padding: 15px;">
                <span style="color: #ff6666;">Error: ${error.message}</span>
              </div>`;
              console.error("AI analysis error:", error);
            }
          });
          
          autoTradeButton.addEventListener('click', () => {
            // Implement auto trading logic
            // This would trigger AI-based trading based on the signal
          });
          
          createOrderButton.addEventListener('click', () => {
            // Handle limit order creation
            // This would collect form data and send to background script
          });
          
          refreshButton.addEventListener('click', () => {
            // Refresh active orders list
            // This would query background script for latest orders
          });
          
          // Add the panel to the page
          chartsContainer.appendChild(advancedPanel);
        };
        
        // Add this panel when the charts are loaded
        searchAndFindChartsContainer(elementsClassname?.placement_selectors?.neobullx?.token?.charts?.container)
          .then(container => {
            if (container) {
              setTimeout(addAdvancedTradingPanel, 1000);
            }
          });
      });
  } catch (err) {
    console.error(err);
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

        const cards = Array.from(
          document.querySelectorAll(
            elementsClassname?.placement_selectors?.neobullx?.memescope?.card,
          ),
        );

        cards.forEach((card) => {
          const isMigrating = Array.from(
            card.querySelectorAll(
              elementsClassname?.placement_selectors?.neobullx?.memescope
                ?.migrating?.element,
            ),
          ).some(
            (span) =>
              span.textContent ===
              elementsClassname?.placement_selectors?.neobullx?.memescope
                ?.migrating?.content,
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

          const poolLink = card.querySelector('a[href*="/terminal"]');
          if (!poolLink) return;

          let actionArea = card.querySelector(
            elementsClassname?.placement_selectors?.neobullx?.memescope
              ?.action_area,
          );
          actionArea.classList.remove(
            "opacity-0",
            "!w-[44px]",
            "group-hover:!w-[74px]",
            "group-hover:opacity-100",
          );
          if (!isMigrating) actionArea.classList.add("w-[74px]");
          actionArea.classList.add("opacity-100");
          actionArea.style.transition = "all 0s";
          if (actionArea.querySelector("span")) {
            actionArea
              .querySelector("span")
              .classList.remove(
                "!hidden",
                "opacity-0",
                "group-hover:!inline-block",
                "group-hover:opacity-100",
              );
            actionArea
              .querySelector("span")
              .classList.remove("inline-block", "opacity-100");
          }

          if (isMigrating) {
            let actionSpan = Array.from(
              card.querySelectorAll(
                elementsClassname?.placement_selectors?.neobullx?.memescope
                  ?.migrating?.element,
              ),
            ).find(
              (span) =>
                span.textContent ===
                elementsClassname?.placement_selectors?.neobullx?.memescope
                  ?.migrating?.content,
            );
            actionArea = actionSpan?.closest("div");
          }
          if (!actionArea) return;

          const generatedBuyButtonClassName = elementsClassname?.b;
          const generatedSnipeButtonClassName = elementsClassname?.sn;
          const buttonClass = isMigrating
            ? generatedSnipeButtonClassName
            : generatedBuyButtonClassName;

          const anotherCustomButton = document.createElement("button");

          anotherCustomButton.textContent = isMigrating
            ? elementsClassname?.texts?.snipe
            : elementsClassname?.texts?.buy;
          anotherCustomButton.type = "button";
          anotherCustomButton.classList.add(
            buttonClass,
            "ant-btn",
            "ant-btn-text",
          );
          anotherCustomButton.style.padding = "0px 26px";

          anotherCustomButton.style.border = elementsClassname?.br?.b;
          anotherCustomButton.style.borderRadius = "20px";
          anotherCustomButton.style.margin = "0px 6px";
          anotherCustomButton.style.zIndex = "1000";

          const poolUrl = new URL(poolLink.href);
          const tokenMintAddress = poolUrl.searchParams.get("address");

          const handleQuickBuy = async (event, button) => {
            event.isTrusted = true;
            button.disabled = true;
            button.textContent = "Processing...";

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
                  button.textContent = "Success!";
                  setTimeout(() => {
                    button.textContent = isMigrating
                      ? elementsClassname?.texts?.snipe
                      : elementsClassname?.texts?.buy;
                    anotherCustomButton.disabled = false;
                  }, 700);
                } else {
                  button.textContent = "Failed!";
                  setTimeout(() => {
                    button.textContent = isMigrating
                      ? elementsClassname?.texts?.snipe
                      : elementsClassname?.texts?.buy;
                    anotherCustomButton.disabled = false;
                  }, 700);
                }
              },
            );
          };
          anotherCustomButton.onclick = (event) => {
            event.preventDefault();
            event.stopPropagation();
            event.isTrusted = true;
            event.cancelable = true;
            event.defaultPrevented = true;

            handleQuickBuy(event, anotherCustomButton);
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

      

      if (request.message === "neo-bullx-pump-vision") {
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
        }, 3000);

        const container = await searchAndFindPumpVisionContainer(
          elementsClassname?.placement_selectors?.neobullx?.memescope
            ?.container,
        );
        if (container) {
            /* injectcipherMemescopeButtonList();
            const observer = new MutationObserver(() =>
              injectcipherMemescopeButtonList(),
            ); */
          observer.observe(container, { childList: true, subtree: true });
        }
      }

      if (request.message === "neo-bullx-token-save") {
        const currentUrl = window.location.href;
        if (currentUrl.includes("/terminal")) {
          
          injectcipherContainer();
        }
      }

      if (request.message === "neo-bullx-token") {
        

        const buySellContainer = await searchAndFindBuyAndSellContainer(
          elementsClassname?.placement_selectors?.neobullx?.token?.snipe
            ?.container,
        );
        if (buySellContainer) {
         /// injectcipherSnipeButton();
        }
        let currentMigrating = document.querySelector(
          elementsClassname?.placement_selectors?.neobullx?.token?.snipe
            ?.migrating,
        );
        if (buySellContainer) {
          const observer = new MutationObserver(() => {
            const migrating = document.querySelector(
              elementsClassname?.placement_selectors?.neobullx?.token?.snipe
                ?.migrating,
            );
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

        const chartsContainer = await searchAndFindChartsContainer(
          elementsClassname?.placement_selectors?.neobullx?.token?.container,
        );
        if (chartsContainer) {
          injectcipherContainer();
        } else {
        }
      }
    });
});

const getTickerFromPage = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        const tickerElement = document.querySelector("#root > div.ant-layout.ant-layout-has-sider > div.ant-layout.site-layout.w-full.overflow-hidden.no-scrollbar.md\\:h-screen.md\\:min-h-screen.md\\:max-h-screen.md\\:ml-\\[56px\\] > main > div > div.flex.flex-col.flex-1.border.border-grey-500.rounded.w-full.no-scrollbar.bg-grey-900.md\\:overflow-y-auto > div.text-xs.flex.flex-col.md\\:flex-row.items-center.font-medium.text-left > div.flex.items-center.justify-between.py-\\[7px\\].w-full.md\\:w-auto.md\\:mt-0.md\\:border-t-0.px-2.md\\:pr-8 > div.flex.flex-row.items-center.w-full.md\\:w-full.max-w-full.text-grey-200.flex-wrap > div.flex.flex-col.ml-1.md\\:ml-2.flex-1.overflow-hidden > div:nth-child(1) > div.\\!p-0.\\!m-0.\\!h-auto.relative.hover\\:cursor-pointer.flex.gap-1.overflow-hidden.items-center > span > span.font-normal.text-grey-50.block.text-sm.\\!leading-\\[16px\\]");
        resolve(tickerElement?.textContent || "Chat");
      } catch (error) {
        console.error("Error getting ticker:", error);
        resolve("Chat");
      }
    }, 2000); // 2 seconds delay
  });
};
