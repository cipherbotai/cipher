// Function to check and update theme
function updateTheme() {
  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  console.log("Theme detected:", isDarkMode ? "dark" : "light");
  
  // Store the theme preference
  chrome.storage.local.set({ theme: isDarkMode ? "dark" : "light" }, () => {
    // Send message to update icon
    chrome.runtime.sendMessage({ scheme: isDarkMode ? "dark" : "light" });
  });
}

// Check theme when script loads
updateTheme();

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addListener(updateTheme);