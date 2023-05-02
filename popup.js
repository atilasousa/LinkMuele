let data = null;
const summarysContentIds = ["phishing", "malicious", "malware"];

function newLi(innerContent) {
  const newLi = document.createElement("li");

  newLi.innerHTML = innerContent;

  return newLi;
}

function generateList(object) {
  const dataList = object;
  const newUl = document.createElement("ul");

  for (let key in dataList) {
    newUl.appendChild(newLi(key));
  }

  return newUl;
}

function printData(data) {
  console.log("data", data);
  document.getElementById("alert_logo").classList.add("phishing");

  document.getElementById("icon").src = "./assets/images/dangerIcon/128.png";

  document.getElementById("alert_text").innerHTML = "ALERTA PHISHING";

  for (const element of summarysContentIds) {
    const el = document.getElementById(element);
    const elTitle = document.getElementById(`${element}Title`);

    if (data.phishingData && element === "phishing") {
      elTitle.innerHTML = `Empresas que classificaram como phishing`;
      el.appendChild(generateList(data.phishingData));
    } else if (data.maliciousData && element === "malicious") {
      elTitle.innerHTML = `Empresas que classificaram como malicioso`;
      el.appendChild(generateList(data.maliciousData));
    } else if (data.malwareData && element === "malware") {
      elTitle.innerHTML = `Empresas que classificaram como malware`;
      el.appendChild(generateList(data.malwareData));
    }
  }
}

function printMaliciousData(data) {
  console.log(data);
  document.getElementById("alert_logo").classList.add("warning");

  document.getElementById("icon").src = "./assets/images/warningIcon/128.png";

  document.getElementById("alert_text").innerHTML = "ALERTA DE SEGURANÇA";

  document.getElementById("reportButton").classList.add("warning");

  for (const element of summarysContentIds) {
    const el = document.getElementById(element);
    const elTitle = document.getElementById(`${element}Title`);

    if (data.phishingData && element === "phishing") {
      elTitle.innerHTML = `Empresas que classificaram como phishing`;
      el.appendChild(generateList(data.phishingData));
    } else if (data.maliciousData && element === "malicious") {
      elTitle.innerHTML = `Empresas que classificaram como malicioso`;
      el.appendChild(generateList(data.maliciousData));
    } else if (
      Object.keys(data.malwareData).length != 0 &&
      element === "malware"
    ) {
      console.log("malwareData");
      elTitle.innerHTML = `Empresas que classificaram como malware`;
      el.appendChild(generateList(data.malwareData));
    }
  }
}

function printSafeData() {
  document.getElementById("icon").src = "./assets/images/safeIcon/128.png";

  document.getElementById("alert_logo").classList.add("safe");

  document.getElementById("alert_text").innerHTML =
    "NÃO FORAM DECTEDADAS AMEAÇAS";

  document.getElementById("description").remove();

  document.getElementById("reportButton_holder").remove();

  document.getElementsByClassName("info")[0].style =
    "display:flex; justify-content: center; align-items: center;";
}

document.getElementById("close_button").addEventListener("click", () => {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: "open_modal" });
  });
});

chrome.storage.session.get(function (result) {
  console.log(result);
  if (Object.keys(result).length != 0) {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      const urlKey = tabs[0].url;

      if (Object.keys(result).includes(urlKey)) {
        data = result[urlKey];
        if (!result[urlKey].tabData.malicious) {
          printData(data);
        } else {
          printMaliciousData(data);
        }
      } else {
        printSafeData();
      }
    });
  } else {
    printSafeData();
  }
});

function hideInitComponent() {
  document.getElementById("alert_text").remove();
  document.getElementById("description").remove();
  document.getElementById("reportButton_holder").remove();

  // document.getElementById("detailsTitle").remove();
}

function showFullReport() {
  const detailsHolder = document.getElementsByClassName("details_holder");

  document.getElementById("category").style.display = "block";

  if (data.phishingData) {
    detailsHolder[0].style.display = "block";
  }
  if (data.maliciousData) {
    detailsHolder[1].style.display = "block";
  }
  if (Object.keys(data.malwareData).length != 0) {
    detailsHolder[2].style.display = "block";
  }
}

document.getElementById("reportButton").addEventListener("click", () => {
  hideInitComponent();

  showFullReport();
});

function showDetails() {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: "showReport" });
  });
}
