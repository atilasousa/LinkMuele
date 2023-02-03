let data = null;

chrome.runtime.sendMessage({ type: "runtime", url: location.href }, () => {
  return true;
});

const onMessageHandler = (message, sender, sendResponse) => {
  if (message.type === "tabDataAnalyses" && message.from === "background") {
    data = message.tabAnalysis;
  }

  if (message.type === "dataRequest" && message.from === "popup") {
    sendResponse(data);
  }
  console.log("sender", sender);
  console.log("message in content", message);

  return true;
};

chrome.runtime.onMessage.removeListener(onMessageHandler);

chrome.runtime.onMessage.addListener(onMessageHandler);
