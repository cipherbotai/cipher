const getAuthOnLocalStorage = async () => {
  const interval = 1200;
  let isTokenFound;

  while (!isTokenFound) {
    const cipherAuthToken = localStorage.getItem("cipher_auth_token");
    if (cipherAuthToken) {
      isTokenFound = true;
      return cipherAuthToken;
    } else {
    }
    await new Promise((r) => setTimeout(r, interval));
  }

  return null;
};

const removeLocalStorageAfterStoring = () => {
  chrome.storage.local.get(["cipher_auth_token"]).then((result) => {
    if (result.cipher_auth_token) {
      localStorage.clear();
    }
  });
};

const main = async () => {
  const cipherAuthToken = await getAuthOnLocalStorage();

  if (cipherAuthToken) {
    await chrome.runtime.sendMessage({
      context: "Cipher Auth Token Found 🪙",
      token: cipherAuthToken,
    });

    chrome.storage.local.set(
      {
        cipher_auth_token: cipherAuthToken,
      },
      () => {
        removeLocalStorageAfterStoring();
      },
    );
  }
};

const observeForSuccess = () => {
  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList") {
        const successElement = document.querySelector(
          "h3.font__gothic__bold.text-2xl.text-white",
        );
        if (
          successElement &&
          successElement.textContent.trim() === "Success!"
        ) {
          observer.disconnect();
          main();
          break;
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
};
observeForSuccess();

chrome.runtime.onMessage.addListener((request) => {
  if (request.context === "Trigger base.js") {
    main();
  }
});
