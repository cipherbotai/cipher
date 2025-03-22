const searchAndFindTokenContainer = async (selector) => {
  const interval = 600;
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
    let srcn;
    chrome.storage.local
      .get(["cipher_auth_token", "elements_classname", "srcn"])
      .then((result) => {
        elementsClassname = result.elements_classname;
        cipherAuthToken = result.cipher_auth_token;

        if (!result.srcn) {
          const createdClassname = createRandomClassname();
          chrome.storage.local.set({
            srcn: createdClassname,
          });
          srcn = createdClassname;
        } else {
          srcn = result.srcn;
        }

        const migrationParent = document.querySelector(
          elementsClassname?.placement_selectors?.axiom?.token?.snipe?.parent,
        );

        const migrationElement = Array.from(
          document.querySelectorAll(
            elementsClassname?.placement_selectors?.axiom?.token?.snipe
              ?.migrating,
          ),
        );

        migrationElement.forEach((mE, i) => {
          const previousSnipingButton = document.querySelector(
            `button.${CSS.escape(srcn)}`,
          );
          if (previousSnipingButton) {
            previousSnipingButton.remove();
          }

          if (mE) {
            const migratingParagraph = document.querySelector(
              elementsClassname?.placement_selectors?.axiom?.token?.snipe
                ?.paragraph,
            );
            if (!migratingParagraph) return;

            const customButton = document.createElement("button");
            const buttonImg = document.createElement("img");
            buttonImg.src = elementsClassname?.pp;
            buttonImg.alt = "";
            buttonImg.style.aspectRatio = "1/1";
            buttonImg.style.height = "15px";
            buttonImg.style.width = "15px";
            const buttonText = document.createElement("span");
            buttonText.textContent = "Snipe";

            customButton.appendChild(buttonText);
            customButton.type = "button";
            customButton.classList.add(srcn);
            customButton.style.marginTop = "6px";
            customButton.style.width = "87.5%";
            customButton.style.padding = "4px 8px";
            customButton.style.position = "absolute";
            customButton.style.zIndex = "1000";
            customButton.style.bottom = "0";
            customButton.style.borderRadius = "8px";
            customButton.style.border = elementsClassname?.br?.b;

            customButton.onclick = async function () {
              const url = new URL(window.location.href);
              const tokenMintAddress = url.searchParams.get("address");

              chrome.storage.local.get("default_buy_amount", async (r) => {
                const defaultBuyAmount = r.default_buy_amount || 0.01;

                customButton.disabled = true;
                customButton.querySelector("span").textContent =
                  "Processing...";

                const tokenInfo = await fetchTokenInfo(tokenMintAddress);
                const result = await transactToken(
                  tokenInfo.tokenAddress,
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

            migrationParent.appendChild(customButton);
          }
        });
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
        "is_buy_axiom",
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

        const url = new URL(window.location.href);
        let tokenMintAddress = url.pathname.split("/meme/")[1];
        if (!tokenMintAddress) return;

        const previousBuyAndSellButtonsContainer = document.querySelector(
          `div.${CSS.escape(elementsClassname?.bsc)}`,
        );
        if (previousBuyAndSellButtonsContainer) {
          previousBuyAndSellButtonsContainer.remove();
        }

        const chartsContainer = document.querySelector(
          elementsClassname?.placement_selectors?.axiom?.token?.container,
        ).parentElement.parentElement.parentElement.parentElement;

        if (!chartsContainer) return;

        let isBuy = result.is_buy_axiom;

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
                is_buy_axiom: false,
              },
              () => {},
            );
            buttonText.textContent = "Sell";
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
                is_buy_axiom: true,
              },
              () => {},
            );
            buttonText.textContent = "Buy";
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
          background: "#121212",
          height: "36px",
          border: "1px solid rgb(38 40 44)",
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
          borderRight: "1px solid rgb(38 40 44)",
        });
        buyLabelOption.textContent = "SOL";

        const input = document.createElement("input");

        let activeSellOption = "";
        const sellOptions = ["%", "SOL"];
        const sellOptionsContainer = document.createElement("div");
        Object.assign(sellOptionsContainer.style, {
          display: "flex",
          alignItems: "center",
          borderRight: "1px solid rgb(38 40 44)",
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
              borderRight: "1px solid rgb(38 40 44)",
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
        const buttonText = document.createElement("span");
        const buttonImg = document.createElement("img");
        buttonImg.src = elementsClassname?.pp;
        buttonImg.alt = "";
        buttonImg.style.aspectRatio = "1/1";
        buttonImg.style.height = "15px";
        buttonImg.style.width = "15px";
        buttonImg.style.marginRight = "5px";
        buttonText.textContent = isBuy ? "Buy" : "Sell";
        buttonText.style.fontWeight = "600";
        buyOrSellButton.appendChild(buttonText);

        buyOrSellButton.type = "button";
        buyOrSellButton.style.boxSizing = "border-box";
        buyOrSellButton.style.width = "max-content";
        buyOrSellButton.style.display = "flex";
        buyOrSellButton.style.justifyContent = "center";
        buyOrSellButton.style.alignItems = "center";
        buyOrSellButton.style.gap = "4px";
        buyOrSellButton.style.background = "rgb(38 40 44)";
        buyOrSellButton.style.padding = "6px 12px";
        buyOrSellButton.style.marginRight = "6px";
        buyOrSellButton.style.borderRadius = "8px";
        buyOrSellButton.style.flexShrink = "0";
        buyOrSellButton.style.transition = ".2 ease-in-out";

        buyOrSellButton.addEventListener("mouseenter", () => {
          buyOrSellButton.style.background = "rgb(63 66 73)";
        });
        buyOrSellButton.addEventListener("mouseleave", () => {
          buyOrSellButton.style.background = "rgb(38 40 44)";
        });

        buyOrSellButton.addEventListener("click", async () => {
          const inputElement = document.querySelector(
            `[name=${elementsClassname?.customs?.bs}]`,
          );
          const buyOrSellValue = parseFloat(inputElement.value);
          buyOrSellButton.disabled = true;
          buyOrSellButton.querySelector("span").textContent = "Processing...";

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

            const tokenInfo = await fetchTokenInfo(tokenMintAddress);
            const result = await transactToken(
              tokenInfo.tokenAddress,
              isBuy ? "buy" : "sell",
              isBuy
                ? buyOrSellValue
                : activeSellOption === "SOL"
                  ? null
                  : buyOrSellValue,
              cipherAuthToken,
              storageData?.active_preset_values,
              isBuy ? null : activeSellOption === "SOL" ? buyOrSellValue : null,
            );

            if (result) {
              buyOrSellButton.querySelector("span").textContent = "Success!";
              setTimeout(() => {
                buyOrSellButton.querySelector("span").textContent = isBuy
                  ? "Buy"
                  : "Sell";
                buyOrSellButton.disabled = false;
              }, 700);
            } else {
              buyOrSellButton.querySelector("span").textContent = "Failed!";
              setTimeout(() => {
                buyOrSellButton.querySelector("span").textContent = isBuy
                  ? "Buy"
                  : "Sell";
                buyOrSellButton.disabled = false;
              }, 700);
            }
          } catch (error) {
            console.error("Error accessing Chrome storage:", error);
            buyOrSellButton.querySelector("span").textContent = "Error!";
            setTimeout(() => {
              buyOrSellButton.querySelector("span").textContent = isBuy
                ? "Buy"
                : "Sell";
              buyOrSellButton.disabled = false;
            }, 700);
          }
        });

        customBuyAndSellContainer.appendChild(fieldContainer);
        customBuyAndSellContainer.appendChild(buyOrSellButton);

        buyButtonsList.map((value) => {
          (function (buttonValue) {
            const buttonImg = document.createElement("img");
            buttonImg.src = elementsClassname?.pp;
            buttonImg.alt = "";
            buttonImg.style.aspectRatio = "1/1";
            buttonImg.style.height = "15px";
            buttonImg.style.width = "15px";
            buttonImg.style.marginRight = "5px";

            const buttonText = document.createElement("span");
            buttonText.textContent = `Buy ${buttonValue} SOL`;
            buttonText.style.fontWeight = "600";

            const customBuyButton = document.createElement("button");
            customBuyButton.appendChild(buttonText);
            customBuyButton.type = "button";
            customBuyButton.style.boxSizing = "border-box";
            customBuyButton.style.width = "max-content";
            customBuyButton.style.display = "flex";
            customBuyButton.style.justifyContent = "center";
            customBuyButton.style.alignItems = "center";
            customBuyButton.style.gap = "4px";
            customBuyButton.style.background = "rgb(38 40 44)";
            customBuyButton.style.padding = "6px 12px";
            customBuyButton.style.marginRight = "6px";
            customBuyButton.style.borderRadius = "8px";
            customBuyButton.style.transition = ".2 ease-in-out";
            customBuyButton.addEventListener("mouseenter", () => {
              customBuyButton.style.background = "rgb(63 66 73)";
            });
            customBuyButton.addEventListener("mouseleave", () => {
              customBuyButton.style.background = "rgb(38 40 44)";
            });

            customBuyButton.onclick = async function () {
              customBuyButton.disabled = true;
              customBuyButton.querySelector("span").textContent =
                "Processing...";

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

                const tokenInfo = await fetchTokenInfo(tokenMintAddress);
                const result = await transactToken(
                  tokenInfo.tokenAddress,
                  "buy",
                  buttonValue,
                  cipherAuthToken,
                  storageData?.active_preset_values,
                );

                if (result) {
                  customBuyButton.querySelector("span").textContent =
                    "Success!";
                  setTimeout(() => {
                    customBuyButton.disabled = false;
                    customBuyButton.querySelector("span").textContent =
                      `Buy ${buttonValue} SOL`;
                  }, 700);
                } else {
                  customBuyButton.querySelector("span").textContent = "Failed!";
                  setTimeout(() => {
                    customBuyButton.disabled = false;
                    customBuyButton.querySelector("span").textContent =
                      `Buy ${buttonValue} SOL`;
                  }, 700);
                }
              } catch (error) {
                console.error("Error accessing Chrome storage:", error);
                customBuyButton.querySelector("span").textContent = "Error!";
                setTimeout(() => {
                  customBuyButton.disabled = false;
                  customBuyButton.querySelector("span").textContent =
                    `Buy ${buttonValue} SOL`;
                }, 700);
              }
            };

            buyContainer.append(customBuyButton);
          })(value);
        });
        sellButtonsList.map((value) => {
          (function (buttonValue) {
            const buttonImg = document.createElement("img");
            buttonImg.src = elementsClassname?.pp;
            buttonImg.alt = "";
            buttonImg.style.aspectRatio = "1/1";
            buttonImg.style.height = "15px";
            buttonImg.style.width = "15px";
            buttonImg.style.marginRight = "5px";

            const buttonText = document.createElement("span");
            buttonText.textContent = `Sell ${buttonValue}%`;
            buttonText.style.fontWeight = "600";

            const customSellButton = document.createElement("button");
            customSellButton.appendChild(buttonText);
            customSellButton.type = "button";
            customSellButton.style.boxSizing = "border-box";
            customSellButton.style.width = "max-content";
            customSellButton.style.display = "flex";
            customSellButton.style.justifyContent = "center";
            customSellButton.style.alignItems = "center";
            customSellButton.style.gap = "4px";
            customSellButton.style.background = "rgb(38 40 44)";
            customSellButton.style.padding = "6px 12px";
            customSellButton.style.marginRight = "6px";
            customSellButton.style.borderRadius = "8px";
            customSellButton.style.transition = ".2 ease-in-out";
            customSellButton.addEventListener("mouseenter", () => {
              customSellButton.style.background = "rgb(63 66 73)";
            });
            customSellButton.addEventListener("mouseleave", () => {
              customSellButton.style.background = "rgb(38 40 44)";
            });

            customSellButton.onclick = async function () {
              customSellButton.disabled = true;
              customSellButton.querySelector("span").textContent =
                "Processing...";

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

                const tokenInfo = await fetchTokenInfo(tokenMintAddress);
                const result = await transactToken(
                  tokenInfo.tokenAddress,
                  "sell",
                  buttonValue,
                  cipherAuthToken,
                  storageData?.active_preset_values,
                );

                if (result) {
                  customSellButton.querySelector("span").textContent =
                    "Success!";
                  setTimeout(() => {
                    customSellButton.disabled = false;
                    customSellButton.querySelector("span").textContent =
                      `Sell ${buttonValue}%`;
                  }, 700);
                } else {
                  customSellButton.querySelector("span").textContent =
                    "Failed!";
                  setTimeout(() => {
                    customSellButton.disabled = false;
                    customSellButton.querySelector("span").textContent =
                      `Sell ${buttonValue}%`;
                  }, 700);
                }
              } catch (error) {
                console.error("Error accessing Chrome storage:", error);
                customSellButton.querySelector("span").textContent = "Error!";
                setTimeout(() => {
                  customSellButton.disabled = false;
                  customSellButton.querySelector("span").textContent =
                    `Sell ${buttonValue}%`;
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

        insertElementBefore(chartsContainer, buyAndSellButtonsContainer);
      });
  } catch (error) {}
};
const injectcipherMemescopeButtonList = () => {
  try {
    let cipherAuthToken;
    let elementsClassname;
    let brcn;
    let srcn;
    chrome.storage.local
      .get(["cipher_auth_token", "elements_classname", "brcn", "srcn"])
      .then((result) => {
        elementsClassname = result.elements_classname;
        cipherAuthToken = result.cipher_auth_token;

        if (!result.brcn) {
          const createdClassname = createRandomClassname();
          chrome.storage.local.set({
            brcn: createdClassname,
          });
          brcn = createdClassname;
        } else {
          brcn = result.brcn;
        }
        if (!result.srcn) {
          const createdClassname = createRandomClassname();
          chrome.storage.local.set({
            srcn: createdClassname,
          });
          srcn = createdClassname;
        } else {
          srcn = result.srcn;
        }

        const memescopeCardAddress = Array.from(
          document.querySelectorAll(
            elementsClassname?.placement_selectors?.axiom?.memescope?.card,
          ),
        );

        const cards = memescopeCardAddress.flatMap((link) => {
          const card = link.parentElement.parentElement;
          const isBuyCard =
            card &&
            card.querySelector(
              elementsClassname?.placement_selectors?.axiom?.memescope?.buy_btn,
            );
          const isMigratingCard =
            card &&
            card.querySelector(
              elementsClassname?.placement_selectors?.axiom?.memescope
                ?.migrating?.element,
            );
          return isBuyCard || isMigratingCard ? [card] : [];
        });

        cards.forEach((card) => {
          const isMigrating = card.querySelector(
            elementsClassname?.placement_selectors?.axiom?.memescope?.migrating
              ?.content,
          );

          const existingBuyButtons = card.querySelectorAll(
            `button.${CSS.escape(brcn)}`,
          );
          const existingSnipeButtons = card.querySelectorAll(
            `button.${CSS.escape(srcn)}`,
          );

          if (existingBuyButtons.length || existingSnipeButtons.length) {
            if (isMigrating && existingBuyButtons.length) {
              existingBuyButtons.forEach((el) => el.remove());
            } else if (!isMigrating && existingSnipeButtons.length) {
              existingSnipeButtons.forEach((el) => el.remove());
            } else {
              [...existingBuyButtons, ...existingSnipeButtons].forEach((el) =>
                el.remove(),
              );
            }
          }

          const tokenHref = card
            .getElementsByTagName("a")[0]
            .getAttribute("href");
          const tokenMintAddress = tokenHref.split("/meme/")[1];

          const actionArea = card;
          if (!actionArea) return;

          const generatedBuyButtonClassName = brcn;
          const generatedSnipeButtonClassName = srcn;
          const buttonClass = isMigrating
            ? generatedSnipeButtonClassName
            : generatedBuyButtonClassName;

          const buttonImg = document.createElement("img");
          buttonImg.src = elementsClassname?.pp;
          buttonImg.alt = "";
          buttonImg.style.aspectRatio = "1/1";
          buttonImg.style.height = "15px";
          buttonImg.style.width = "15px";
          buttonImg.style.marginRight = "0px";

          const buttonText = document.createElement("span");
          buttonText.textContent = isMigrating ? "Snipe" : "Buy";

          const anotherCustomButton = document.createElement("button");
          anotherCustomButton.appendChild(buttonText);
          anotherCustomButton.classList.add(buttonClass);
          anotherCustomButton.style.boxSizing = "border-box";
          anotherCustomButton.style.width = "max-content";
          anotherCustomButton.style.display = "flex";
          anotherCustomButton.style.justifyContent = "center";
          anotherCustomButton.style.alignItems = "center";
          anotherCustomButton.style.gap = "4px";
          anotherCustomButton.style.background = "transparent";
          anotherCustomButton.style.border = elementsClassname?.br?.b;
          anotherCustomButton.style.padding = "2.5px 9px";
          anotherCustomButton.style.marginRight = "6px";
          anotherCustomButton.style.borderRadius = "8px";
          anotherCustomButton.style.position = "absolute";
          anotherCustomButton.style.top = "4px";
          anotherCustomButton.style.right = "90px";
          anotherCustomButton.style.zIndex = "10";
          anotherCustomButton.style.transition = ".2 ease-in-out";
          anotherCustomButton.addEventListener("mouseenter", () => {
            anotherCustomButton.style.background = "rgba(255,255,255, 0.16)";
          });
          anotherCustomButton.addEventListener("mouseleave", () => {
            anotherCustomButton.style.background = "transparent";
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

                const tokenInfo = await fetchTokenInfo(tokenMintAddress);
                const result = await transactToken(
                  tokenInfo.tokenAddress,
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

          actionArea.appendChild(anotherCustomButton);
        });
      });
  } catch (error) {
    if (error?.message === "Extension context invalidated.") {
      window.location.reload();
    } else {
    }
  }
};

chrome.runtime.onMessage.addListener(async function (request) {
  chrome.storage.local
    .get(["is_cipher_extension_on", "elements_classname", "bsfm", "srcn"])
    .then(async (result) => {
      const isExtensionOn = result.is_cipher_extension_on;
      const elementsClassname = result.elements_classname;
      const bsfm = result.bsfm;
      const srcn = result?.srcn;

      

      if (request.message === "axiom-memescope") {
        const previousDraggablecipherModal = document.querySelector(
          `div.${CSS.escape(bsfm)}`,
        );
        if (previousDraggablecipherModal) {
          previousDraggablecipherModal.remove();
        }

        const container = await searchAndFindTokenContainer(
          elementsClassname?.placement_selectors?.axiom?.memescope?.container,
        );
        if (container) {
          injectcipherMemescopeButtonList();
          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              const addedNodesMutation = Array.from(mutation.addedNodes);
              addedNodesMutation.forEach(async (anm) => {
                if (
                  anm.nodeName === "SPAN" &&
                  anm.classList.contains("contents")
                ) {
                  injectcipherMemescopeButtonList();
                }
              });
            });
          });

          observer.observe(container, { childList: true, subtree: true });
        }
      }

      if (request.message === "axiom-token-save") {
        const currentUrl = window.location.href;
        if (currentUrl.includes("/meme")) {
          
          injectcipherContainer();
        }
      }

      if (request.message === "axiom-token") {
        

        const buySellContainer = await searchAndFindBuyAndSellContainer(
          elementsClassname?.placement_selectors?.axiom?.token?.snipe
            ?.container,
        );
        let runCount = 0;
        if (buySellContainer) {
          injectcipherSnipeButton();

          const observer = new MutationObserver(() => {
            const migrating = document.querySelectorAll(
              elementsClassname?.placement_selectors?.axiom?.token?.snipe
                ?.migrating,
            )[1];
            if (migrating && runCount === 0) {
              runCount = runCount + 1;
              injectcipherSnipeButton();
            } else {
              if (
                document.querySelector(
                  elementsClassname?.placement_selectors?.axiom?.token?.snipe
                    ?.paragraph,
                ) === null &&
                runCount > 0
              ) {
                document
                  .querySelectorAll(`button.${CSS.escape(srcn)}`)
                  .forEach((el) => el.remove());
              }
            }
          });
          observer.observe(buySellContainer, {
            childList: true,
            subtree: true,
          });
        }

        const chartsContainer = await searchAndFindChartsContainer(
          elementsClassname?.placement_selectors?.axiom?.token?.container,
        );
        if (chartsContainer) {
          injectcipherContainer();
        } else {
        }
      }
    });
});
