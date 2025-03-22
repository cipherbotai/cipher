const loadScript = (parent = document.head || document.documentElement) => {
  const scriptId = "bullx-ultimate-script";
  if (!document.getElementById(scriptId)) {
    parent.append(
      Object.assign(document.createElement("script"), {
        id: scriptId,
        src: chrome.runtime.getURL("src/ultimates/bullx-ultimate.js"),
        defer: true,
      }),
    );
  }
};

loadScript();
setInterval(loadScript, 5000);
