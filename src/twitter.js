const BUTTON_STYLES = {
  container: {
    display: "inline-flex",
    gap: "4px",
    marginLeft: "4px",
  },
  button: {
    boxSizing: "border-box",
    width: "max-content",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "4px",
    background: "transparent",
    padding: "4px 12px",
    marginRight: "6px",
    border: "1px solid rgba(255,255,255,0.3)",
    borderRadius: "8px",
    cursor: "pointer",
    position: "relative",
    zIndex: "1000",
    transition: ".2 ease-in-out",
  },
  image: {
    aspectRatio: "1/1",
    height: "15px",
    width: "15px",
    marginRight: "0px",
  },
};

const createButtonElements = (elementsClassname) => {
  const buttonContainer = document.createElement("span");
  Object.assign(buttonContainer.style, BUTTON_STYLES.container);
  buttonContainer.classList.add(
    elementsClassname?.b,
    "cipher-buy-btn",
    String(Date.now()),
  );

  const buttonImg = document.createElement("img");
  buttonImg.src = elementsClassname?.pp;
  buttonImg.alt = "";
  Object.assign(buttonImg.style, BUTTON_STYLES.image);

  const buttonText = document.createElement("span");
  buttonText.textContent = "Buy";

  const buyButton = document.createElement("button");
  buyButton.appendChild(buttonImg);
  buyButton.appendChild(buttonText);
  buyButton.type = "button";
  buyButton.classList.add(
    elementsClassname?.b,
    "cipher-buy-btn",
    String(Date.now()),
  );
  Object.assign(buyButton.style, BUTTON_STYLES.button);

  return { buttonContainer, buyButton, buttonText };
};

const handleButtonClick = async (button, tokenMintAddress, cipherAuthToken) => {
  try {
    button.disabled = true;
    button.querySelector("span").textContent = "Processing...";

    const { default_buy_amount, active_preset_values } =
      await chrome.storage.local.get([
        "default_buy_amount",
        "active_preset_values",
      ]);

    const result = await transactToken(
      tokenMintAddress,
      "buy",
      default_buy_amount || 0.01,
      cipherAuthToken,
      active_preset_values,
    );

    const finalText = result ? "Success!" : "Failed!";
    button.querySelector("span").textContent = finalText;

    setTimeout(() => {
      button.querySelector("span").textContent = "Buy";
      button.disabled = false;
    }, 700);
  } catch (error) {
    console.error("Button click handler error:", error);
  }
};

const getMainContainer = async (
  selector = "main",
  timeout = 5000,
  interval = 500,
) => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const element = document.querySelector(selector);
    if (element) return element;
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  return null;
};

const injectcipherButton = async (element, type = "tweet") => {
  try {
    const parentNode =
      type === "tweet"
        ? element.querySelector('div[data-testid="tweetText"]')
        : element;

    if (!parentNode || (type === "tweet" && !parentNode)) return;

    for (const child of Array.from(parentNode.childNodes)) {
      await processNodeForAddresses(child);
    }
  } catch (error) {
    console.error("Failed to add Cipher button:", error);
  }
};

const createcipherBuyButton = async (address) => {
  try {
    const { elements_classname, custom_buy_value_list } =
      await chrome.storage.local.get([
        "elements_classname",
        "custom_buy_value_list",
      ]);

    const cipherAuthToken = await getcipherToken();
    const { buttonContainer, buyButton } =
      createButtonElements(elements_classname);

    buyButton.addEventListener("mouseenter", () => {
      buyButton.style.background = "rgb(38 40 44)";
    });
    buyButton.addEventListener("mouseleave", () => {
      buyButton.style.background = "transparent";
    });

    buyButton.onclick = async (event) => {
      event.preventDefault();
      event.stopPropagation();
      await handleButtonClick(buyButton, address, cipherAuthToken);
    };

    buttonContainer.appendChild(buyButton);
    return buttonContainer;
  } catch (error) {
    console.log("Failed to create Cipher button ❌:", error);
    return null;
  }
};

const createTextNode = (text) => document.createTextNode(text);

const createAddressSpan = async (address) => {
  const span = document.createElement("span");
  span.textContent = address;
  const button = await createcipherBuyButton(address);
  if (button) span.appendChild(button);
  return span;
};

const appendRemainingText = (fragment, text, lastIndex) => {
  if (lastIndex < text.length) {
    fragment.appendChild(createTextNode(text.slice(lastIndex)));
  }
};

const processTextNode = async (currentNode, regex) => {
  const text = currentNode.textContent;
  const contentFragment = document.createDocumentFragment();
  let lastIndex = 0;

  for (let match; (match = regex.exec(text)) !== null; ) {
    const [address] = match;
    const { index: startIndex } = match;

    if (startIndex > lastIndex) {
      contentFragment.appendChild(
        createTextNode(text.slice(lastIndex, startIndex)),
      );
    }

    const addressSpan = await createAddressSpan(address);

    contentFragment.appendChild(addressSpan);

    lastIndex = startIndex + address.length;
  }

  appendRemainingText(contentFragment, text, lastIndex);

  if (contentFragment.childNodes.length > 0) {
    currentNode.replaceWith(contentFragment);
  }

  return contentFragment;
};

const SOLANA_ADDRESS_REGEX = /\b[1-9A-HJ-NP-Za-km-z]{40,50}\b/;

const extractAddress = (node) => {
  const textContent = node.textContent;
  const href = node.getAttribute("href") || "";

  const match =
    href.match(SOLANA_ADDRESS_REGEX) || textContent.match(SOLANA_ADDRESS_REGEX);

  return match ? match[0] : null;
};

const processAnchorNode = async (currentNode) => {
  try {
    const address = extractAddress(currentNode);
    if (!address) return false;

    const buyButton = await createcipherBuyButton(address);
    if (!buyButton) return false;

    if (currentNode) {
      const existingButtonsParent =
        currentNode.parentElement.querySelectorAll(".cipher-buy-btn");

      existingButtonsParent.forEach((button) => button.remove());
    }

    currentNode.insertAdjacentElement("afterend", buyButton);
    return true;
  } catch (error) {
    console.error("Error processing anchor node:", error);
    return false;
  }
};

const isAnchorElement = (node) => node.nodeName.toLowerCase() === "a";

const processChildren = async (node) => {
  const children = Array.from(node.childNodes);
  await Promise.all(children.map(processNodeForAddresses));
};

const processElementNode = async (currentNode) => {
  if (isAnchorElement(currentNode)) {
    return processAnchorNode(currentNode);
  }

  return processChildren(currentNode);
};

async function processNodeForAddresses(currentNode) {
  const solanaAddressRegex = /\b[1-9A-HJ-NP-Za-km-z]{40,50}\b/g;

  if (currentNode.nodeType === Node.TEXT_NODE) {
    return await processTextNode(currentNode, solanaAddressRegex);
  }

  if (currentNode.nodeType === Node.ELEMENT_NODE) {
    await processElementNode(currentNode);
  }
}

const CONTENT_SELECTORS = {
  tweet: {
    type: "tweet",
    testId: "tweetText",
  },
  bio: {
    type: "bio",
    testId: "UserDescription",
  },
};

const findContentNodes = (parentNode, testId) => {
  return Array.from(parentNode.childNodes).find(
    (child) =>
      child.nodeName.toLowerCase() === "div" &&
      child.innerHTML.includes(`data-testid="${testId}"`),
  );
};

const processNewContent = (nodes, contentType) => {
  const { type, testId } = CONTENT_SELECTORS[contentType];

  return Array.from(nodes)
    .map((node) => findContentNodes(node, testId))
    .filter(Boolean)
    .forEach((content) => injectcipherButton(content, type));
};

const OBSERVER_CONFIG = {
  childList: true,
  subtree: true,
};

const CONTENT_TYPES = ["tweet", "bio"];

const handleMutation = (mutation) => {
  if (!mutation.addedNodes.length) return;

  CONTENT_TYPES.forEach((type) => processNewContent(mutation.addedNodes, type));
};

const observeContentChanges = (container) => {
  try {
    const observer = new MutationObserver((mutations) =>
      mutations.forEach(handleMutation),
    );

    observer.observe(container, OBSERVER_CONFIG);
    return observer;
  } catch (error) {
    console.error("Failed to observe content changes:", error);
    return null;
  }
};

const CONTENT_QUERY_SELECTORS = {
  bio: 'div[data-testid="UserDescription"]',
  tweet: "article",
};

const processExistingContent = (container, type, selector) => {
  const elements = container?.querySelectorAll(selector);
  elements?.forEach((element) => injectcipherButton(element, type));
};

const removeAllPreviouscipherButton = () => {
  try {
    const allPreviouscipherButton = Array.from(
      document.querySelectorAll(".cipher-buy-btn"),
    );
    if (allPreviouscipherButton && allPreviouscipherButton.length > 0) {
      allPreviouscipherButton.forEach((prevEl) => prevEl.remove());
    }
  } catch (error) {}
};

const processTwitterContent = async (container) => {
  try {
    processExistingContent(container, "bio", CONTENT_QUERY_SELECTORS.bio);

    processExistingContent(container, "tweet", CONTENT_QUERY_SELECTORS.tweet);

    return observeContentChanges(container);
  } catch (error) {
    console.error("Failed to process Twitter content:", error);
  }
};

chrome.runtime.onMessage.addListener(async function (request) {
  chrome.storage.local
    .get(["is_cipher_extension_on", "elements_classname"])
    .then(async (res) => {
      const isExtensionOn = res.is_cipher_extension_on;

      

      if (request.message === "twitter-content") {
        const container = await getMainContainer();
        if (!container) return;
        removeAllPreviouscipherButton();
        processTwitterContent(container);
      }
    });
});
