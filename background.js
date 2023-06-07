const DB_NAME = "analysedURLs";
const DB_VERSION = 1;
let db;

const optionsVirusTotal = {
  method: "GET",
  headers: {
    accept: "application/json",
    "x-apikey":
      "7e580ce5a657a49226edb9b58790914878649fe7d4185555dbc9470c7bce7215",
  },
};

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("error opening the database:", event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve();
    };

    request.onupgradeneeded = (event) => {
      db = event.target.result;
      db.createObjectStore("urls", { keyPath: "name" });
    };
  });
}

async function saveURLToDB(tabData) {
  const transaction = db.transaction(["urls"], "readwrite");
  const store = transaction.objectStore("urls");

  return new Promise((resolve, reject) => {
    const request = store.add(tabData);

    request.onerror = (event) => {
      console.error(
        "Error when saving the URL in IndexedDB:",
        event.target.error
      );
      reject(event.target.error);
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

async function checkIfTabExist(tabUrl) {
  const transaction = db.transaction(["urls"], "readonly");
  const store = transaction.objectStore("urls");

  return new Promise((resolve, reject) => {
    const request = store.get(tabUrl);

    request.onerror = (event) => {
      console.error(
        "Error when fetching the URL from IndexedDB:",
        event.target.error
      );
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
  });
}

const setIcon = (tabId, type) => {
  chrome.action.setIcon({
    tabId,
    path: {
      16: `./assets/images/${type}/16.png`,
      32: `./assets/images/${type}/32.png`,
      48: `./assets/images/${type}/48.png`,
      128: `./assets/images/${type}/128.png`,
    },
  });
};

function sendMessageToOpenModal(tabId) {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0]?.id, { action: "open_modal" });
  });
}

const runtimeHandler = async (message, sender, sendResponse) => {
  const tabId = sender.tab.id;
  const tabHref = new URL(message?.url).href;

  if (!checkIfTabExist(tabHref) || !checkIfTabExist(tabHref).analysed) {
    if (message.type === "runtime") {
      try {
        const url = new URL(message.url);
        const urlBase64 = btoa(url.href).replace(/^\=+|\=+$/g, "");
        const { signal, abort } = new AbortController();

        const response = await fetch(
          `https://www.virustotal.com/api/v3/urls/${urlBase64}`,
          {
            ...options,
            signal,
          }
        );

        const { data, error } = await response.json();

        if (error) {
          return;
        }

        const tabData = {
          name: url.href,
          id: tabId,
          analysed: true,
          abort,
        };

        const dataList = Object.entries(
          data?.attributes?.last_analysis_results
        );
        const tabStats = data?.attributes?.last_analysis_stats;

        const filterData = (category) =>
          Object.fromEntries(
            dataList.filter(([_, { result }]) =>
              result.toLowerCase().includes(category)
            )
          );

        const phishingData = filterData("phishing");
        const malwareData = filterData("malware");
        const maliciousData = filterData("malicious");

        if (Object.keys(phishingData).length) {
          tabData["phishing"] = true;
          tabStats["phishing"] = Object.keys(phishingData).length;

          chrome.windows.getCurrent((w) => {
            chrome.tabs.query({ windowId: w.id, active: true }, (tabs) => {
              const key = tabs[0]?.url;
              sendMessageToOpenModal();
              chrome.storage.local.set({
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

          setIcon(tabId, "dangerIcon");
        } else if (tabStats.malicious > 0) {
          tabData["malicious"] = true;

          chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
            const key = tabs[0]?.url;
            sendMessageToOpenModal();
            chrome.storage.local.set({
              [key]: { tabStats, tabData, malwareData, maliciousData },
            });
          });

          setIcon(tabId, "warningIcon");
        } else if (tabStats.malicious === 0 && tabStats.harmless > 0) {
          setIcon(tabId, "safeIcon");
        }
      } catch (error) {
        console.error(error);
      }

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
      setIcon(tabId, "dangerIcon");
    } else if (malicious) {
      sendMessageToOpenModal();
      setIcon(tabId, "warningIcon");
    } else {
      setIcon(tabId, "safeIcon");
    }
  }
};

const removeTabHandler = (tabId, removed) => {
  const index = accessedTabs.findIndex((tab) => tab.id === tabId);

  if (index !== -1) {
    const removedTab = accessedTabs[index];
    if (!removedTab.analysed) removedTab.abort();
    accessedTabs.splice(index, 1);
  }
};

const sendMessageToContentScript = (tabId, message) => {
  chrome.tabs.sendMessage(tabId, message);
};

chrome.action.onClicked.addListener(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    sendMessageToContentScript(tab.id, { action: "open_modal" });
  });
});

chrome.runtime.onMessage.removeListener(runtimeHandler);

chrome.runtime.onMessage.addListener(runtimeHandler);

chrome.tabs.onRemoved.removeListener(removeTabHandler);

chrome.tabs.onRemoved.addListener(removeTabHandler);
