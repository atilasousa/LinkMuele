let data = null;

function printData(data) {
  document.querySelector(".phishing").innerHTML = "Tem bug";
}

function onMessageHandler(message, sender, sendResponse) {
  console.log("no popup", message);

  return true;
}

setTimeout(() => {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { type: "dataRequest", from: "popup" },
      (response) => {
        data = response;
        if (data) printData(data);
        console.log(response);
      }
    );
  });
}, 3000);

chrome.runtime.onMessage.removeListener(onMessageHandler);

chrome.runtime.onMessage.addListener(onMessageHandler);
