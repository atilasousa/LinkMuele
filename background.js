const options = {
  method: "GET",
  headers: {
    accept: "application/json",
    "x-apikey":
      "7e580ce5a657a49226edb9b58790914878649fe7d4185555dbc9470c7bce7215",
  },
};

const accessedTabs = [];

const runtimeHandler = (message, sender, sendResponse) => {
  if (message.type === "runtime") {
    const tabId = sender.tab.id;
    const { signal, abort } = new AbortController();

    const url = new URL(message.url);

    const urlBase64 = btoa(url.href).replace(/=\s*$/, "");

    console.log(urlBase64);

    const tabData = {
      name: url.href,
      id: tabId,
      analysed: false,
      abort,
    };

    fetch(`https://www.virustotal.com/api/v3/urls/${urlBase64}`, {
      ...options,
      signal,
    })
      .then((res) => res.json())
      .then((data) => {
        tabData.analysed = true;
        console.log(data);
        console.log(accessedTabs);
      })
      .catch(console.error);

    if (!accessedTabs.find((el) => el.name === tabData.name))
      accessedTabs.push(tabData);
  }
};

const removeTabHandler = function (tabId, removed) {
  const index = accessedTabs.findIndex((tab) => tab.id === tabId);
  const removedTab = accessedTabs.find((el) => el.id === tabId);

  if (removedTab) {
    if (!removedTab.analysed) removedTab.abort();
    accessedTabs.splice(index, 1);
  }

  console.log(accessedTabs);
};

chrome.runtime.onMessage.removeListener(runtimeHandler);

chrome.runtime.onMessage.addListener(runtimeHandler);

chrome.tabs.onRemoved.removeListener(removeTabHandler);

chrome.tabs.onRemoved.addListener(removeTabHandler);
