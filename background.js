const options = {
  method: "GET",
  headers: {
    accept: "application/json",
    "x-apikey":
      "7e580ce5a657a49226edb9b58790914878649fe7d4185555dbc9470c7bce7215",
  },
};

const accessedTabs = [];

const checkIfTabExist = (tabUrl) =>
  accessedTabs.find((tab) => tab.name === tabUrl);

const runtimeHandler = (message, sender, sendResponse) => {
  const tabId = sender.tab.id;
  const tabHref = new URL(message?.url).href;

  if (!checkIfTabExist(tabHref) || !checkIfTabExist(tabHref).analysed) {
    if (message.type === "runtime") {
      const { signal, abort } = new AbortController();

      const url = new URL(message.url);

      const urlBase64 = btoa(url.href).replace(/^\=+|\=+$/g, "");

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
        .then((response) => {
          const { data } = response;

          tabData.analysed = true;

          let dataList = [];
          let phishingData = {};
          let tabStats = {};

          if (response.data) {
            dataList = Object.entries(data?.attributes?.last_analysis_results);

            phishingData = Object.fromEntries(
              dataList.filter(([_, { result }]) => result === "phishing")
            );

            tabStats = data?.attributes?.last_analysis_stats;

            const tabAnalysis = {
              tabStats,
              phishingData,
            };

            if (phishingData) {
              tabData["phishing"] = true;

              chrome.action.setIcon({
                tabId,
                path: {
                  32: "./assets/images/dangerIcon/32.png",
                  16: "./assets/images/dangerIcon/16.png",
                  48: "./assets/images/dangerIcon/48.png",
                  128: "./assets/images/dangerIcon/128.png",
                },
              });

              chrome.tabs.sendMessage(tabData.id, {
                type: "tabDataAnalyses",
                from: "background",
                tabAnalysis,
              });
            }
          }
        })
        .catch((error) => {
          tabData.analysed = false;
          console.error(error);
        });

      if (!accessedTabs.find((el) => el.name === tabData.name))
        accessedTabs.push(tabData);

      console.log("accessedTabs", accessedTabs);
      return true;
    }
  } else return;

  if (checkIfTabExist(tabHref && checkIfTabExist(tabHref).phishing)) {
    chrome.action.setIcon({
      tabId,
      path: {
        32: "./assets/images/dangerIcon/32.png",
        16: "./assets/images/dangerIcon/16.png",
        48: "./assets/images/dangerIcon/48.png",
        128: "./assets/images/dangerIcon/128.png",
      },
    });
  }
};

const removeTabHandler = function (tabId, removed) {
  const index = accessedTabs.findIndex((tab) => tab.id === tabId);
  const removedTab = accessedTabs.find((el) => el.id === tabId);

  if (removedTab) {
    if (!removedTab.analysed) removedTab.abort();
    accessedTabs.splice(index, 1);
  }
};

chrome.runtime.onMessage.removeListener(runtimeHandler);

chrome.runtime.onMessage.addListener(runtimeHandler);

chrome.tabs.onRemoved.removeListener(removeTabHandler);

chrome.tabs.onRemoved.addListener(removeTabHandler);
