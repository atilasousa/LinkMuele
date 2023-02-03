chrome.runtime.sendMessage({ type: "runtime", url: location.href }, () => {
  return true;
});
