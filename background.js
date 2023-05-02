const options = {
  method: "GET",
  headers: {
    accept: "application/json",
    "x-apikey":
      "7e580ce5a657a49226edb9b58790914878649fe7d4185555dbc9470c7bce7215",
  },
};

chrome.storage.session.clear();

const accessedTabs = [];

let currentTab = null;

function sendNotificationToUser(message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "./assets/images/dangerIcon/128.png",
    title: "Perigo",
    message,
  });
  console.log("notification sent");
}

function sendMessageToOpenModal() {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0]?.id, { action: "open_modal" });
  });
}

const checkIfTabExist = (tabUrl) =>
  accessedTabs.find((tab) => tab.name === tabUrl);

const runtimeHandler = (message, sender, sendResponse) => {
  console.log(accessedTabs);
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

          console.log(data);

          tabData.analysed = true;

          let dataList = [];
          let phishingData = {};
          let maliciousData = {};
          let malwareData = {};
          let tabStats = {};

          if (response.data) {
            dataList = Object.entries(data?.attributes?.last_analysis_results);

            tabStats = data?.attributes?.last_analysis_stats;

            phishingData = Object.fromEntries(
              dataList.filter(([_, { result }]) =>
                result.toLowerCase().includes("phishing")
              )
            );

            malwareData = Object.fromEntries(
              dataList.filter(([_, { result }]) =>
                result.toLowerCase().includes("malware")
              )
            );

            maliciousData = Object.fromEntries(
              dataList.filter(([_, { result }]) =>
                result.toLowerCase().includes("malicious")
              )
            );

            if (Object.keys(phishingData).length != 0) {
              tabData["phishing"] = true;
              console.log("phishing");

              tabStats["phishing"] = Object.keys(phishingData).length;

              tabStats["malicious"] = Object.keys(maliciousData).length;

              chrome.windows.getCurrent((w) => {
                chrome.tabs.query({ windowId: w.id, active: true }, (tabs) => {
                  const key = tabs[0]?.url;

                  sendMessageToOpenModal();

                  chrome.storage.session.set({
                    [key]: {
                      tabData,
                      phishingData,
                      malwareData,
                      tabStats,
                      maliciousData,
                    },
                  });
                });
              });

              sendNotificationToUser(`Alerta de phishing em ${url.href}!`);

              chrome.action.setIcon({
                tabId,
                path: {
                  32: "./assets/images/dangerIcon/32.png",
                  16: "./assets/images/dangerIcon/16.png",
                  48: "./assets/images/dangerIcon/48.png",
                  128: "./assets/images/dangerIcon/128.png",
                },
              });
            } else if (tabStats.malicious > 0) {
              tabData["malicious"] = true;
              console.log("malicious");

              chrome.tabs.query(
                { currentWindow: true, active: true },
                (tabs) => {
                  const key = tabs[0]?.url;

                  sendMessageToOpenModal();

                  chrome.storage.session.set({
                    [key]: { tabStats, tabData, malwareData, maliciousData },
                  });
                }
              );

              chrome.action.setIcon({
                tabId,
                path: {
                  32: "./assets/images/warningIcon/32.png",
                  16: "./assets/images/warningIcon/16.png",
                  48: "./assets/images/warningIcon/48.png",
                  128: "./assets/images/warningIcon/128.png",
                },
              });
            } else if (tabStats.malicious === 0 && tabStats.harmless > 0) {
              console.log("safe");
              chrome.action.setIcon({
                tabId,
                path: {
                  16: "./assets/images/safeIcon/16.png",
                  32: "./assets/images/safeIcon/32.png",
                  48: "./assets/images/safeIcon/48.png",
                  128: "./assets/images/safeIcon/128.png",
                },
              });
            }
          }
        })
        .catch((error) => {
          tabData.analysed = false;
          console.error(error);
        });

      if (!accessedTabs.find((el) => el.name === tabData.name)) {
        accessedTabs.push(tabData);
      }

      return true;
    }
  }

  if (checkIfTabExist(tabHref)) {
    const { phishing, malicious } = checkIfTabExist(tabHref);
    if (phishing) {
      sendMessageToOpenModal();
      chrome.action.setIcon({
        tabId,
        path: {
          16: "./assets/images/dangerIcon/16.png",
          32: "./assets/images/dangerIcon/32.png",
          48: "./assets/images/dangerIcon/48.png",
          128: "./assets/images/dangerIcon/128.png",
        },
      });
    } else if (malicious) {
      sendMessageToOpenModal();
      chrome.action.setIcon({
        tabId,
        path: {
          16: "./assets/images/warningIcon/16.png",
          32: "./assets/images/warningIcon/32.png",
          48: "./assets/images/warningIcon/48.png",
          128: "./assets/images/warningIcon/128.png",
        },
      });
    } else {
      chrome.action.setIcon({
        tabId,
        path: {
          16: "./assets/images/safeIcon/16.png",
          32: "./assets/images/safeIcon/32.png",
          48: "./assets/images/safeIcon/48.png",
          128: "./assets/images/safeIcon/128.png",
        },
      });
    }
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

function sendMessageToContentScript(tabId, message) {
  chrome.tabs.sendMessage(tabId, message);
}

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    sendMessageToContentScript(tabs[0].id, { action: "open_modal" });
  });
});

chrome.runtime.onMessage.removeListener(runtimeHandler);

chrome.runtime.onMessage.addListener(runtimeHandler);

chrome.tabs.onRemoved.removeListener(removeTabHandler);

chrome.tabs.onRemoved.addListener(removeTabHandler);
