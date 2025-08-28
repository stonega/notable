chrome.windows.onRemoved.addListener((windowId) => {
  chrome.storage.local.get('windowActiveNotes', (data) => {
    if (data.windowActiveNotes && data.windowActiveNotes[windowId]) {
      delete data.windowActiveNotes[windowId];
      chrome.storage.local.set({ windowActiveNotes: data.windowActiveNotes });
    }
  });
});
