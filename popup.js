const summarysContentIds = ["phishing", "malicious", "malware"];

function createListItem(innerContent) {
  const listItem = document.createElement("li");
  listItem.textContent = innerContent;
  return listItem;
}

function generateList(dataObject) {
  const dataList = Object.keys(dataObject);
  const listElement = document.createElement("ul");

  dataList.forEach((key) => {
    const listItem = createListItem(key);
    listElement.appendChild(listItem);
  });

  return listElement;
}

function printCategories() {
  const categoryElement = document.getElementById("category");
  const detailsTitleElement = document.getElementById("detailsTitle");

  categoryElement.style.display = "block";
  categoryElement.textContent = `Categorias: ${webSiteCategories}`;
  detailsTitleElement.style.display = "block";
}

function printAlert(data, alertType) {
  let alertLogoClass = "";
  let iconSrc = "";
  let alertText = "";
  let reportButtonClass = "";

  switch (alertType) {
    case "phishing":
      alertLogoClass = "phishing";
      iconSrc = "./assets/images/dangerIcon/128.png";
      alertText = "ALERTA PHISHING";
      reportButtonClass = "phishing";
      webSiteCategories = Object.values(data.phishingData).map(
        (item) => item.category
      );
      break;
    case "malicious":
      alertLogoClass = "warning";
      iconSrc = "./assets/images/warningIcon/128.png";
      alertText = "ALERTA DE SEGURANÇA";
      reportButtonClass = "warning";
      webSiteCategories = Object.values(data.maliciousData).map(
        (item) => item.category
      );
      break;
  }

  const alertLogoElement = document.getElementById("alert_logo");
  const iconElement = document.getElementById("icon");
  const alertTextElement = document.getElementById("alert_text");
  const reportButtonElement = document.getElementById("reportButton");

  alertLogoElement.classList.add(alertLogoClass);
  iconElement.src = iconSrc;
  alertTextElement.textContent = alertText;
  reportButtonElement.classList.add(reportButtonClass);

  summarysContentIds.forEach((element) => {
    const el = document.getElementById(element);
    const elTitle = document.getElementById(`${element}Title`);
    let dataToPrint = null;

    switch (element) {
      case "phishing":
        dataToPrint = data.phishingData;
        elTitle.textContent = "Empresas que classificaram como phishing";
        break;
      case "malicious":
        dataToPrint = data.maliciousData;
        elTitle.textContent = "Empresas que classificaram como malicioso";
        break;
      case "malware":
        dataToPrint = data.malwareData;
        elTitle.textContent = "Empresas que classificaram como malware";
        break;
    }

    if (dataToPrint) {
      el.appendChild(generateList(dataToPrint));
    }
  });
}

function printSafeData() {
  const iconElement = document.getElementById("icon");
  const alertLogoElement = document.getElementById("alert_logo");
  const alertTextElement = document.getElementById("alert_text");
  const infoElement = document.getElementsByClassName("info")[0];

  iconElement.src = "./assets/images/safeIcon/128.png";
  alertLogoElement.classList.add("safe");
  alertTextElement.textContent = "NÃO FORAM DETECTADAS AMEAÇAS";

  const descriptionElement = document.getElementById("description");
  const reportButtonHolderElement = document.getElementById(
    "reportButton_holder"
  );

  if (descriptionElement) {
    descriptionElement.remove();
  }
  if (reportButtonHolderElement) {
    reportButtonHolderElement.remove();
  }

  infoElement.style.display = "flex";
  infoElement.style.justifyContent = "center";
  infoElement.style.alignItems = "center";
}

function hideInitComponent() {
  const alertTextElement = document.getElementById("alert_text");
  const descriptionElement = document.getElementById("description");
  const reportButtonHolderElement = document.getElementById(
    "reportButton_holder"
  );

  alertTextElement.remove();

  if (descriptionElement) {
    descriptionElement.remove();
  }
  if (reportButtonHolderElement) {
    reportButtonHolderElement.remove();
  }
}

function showFullReport() {
  const detailsHolder = document.getElementsByClassName("details_holder");

  if (webSiteCategories.length > 0) {
    printCategories();
  }

  if (data.phishingData) {
    detailsHolder[0].style.display = "block";
  }
  if (data.maliciousData) {
    detailsHolder[1].style.display = "block";
  }
  if (Object.keys(data.malwareData).length !== 0) {
    detailsHolder[2].style.display = "block";
  }
}

document.getElementById("close_button").addEventListener("click", () => {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: "open_modal" });
  });
});

chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
  const urlKey = tabs[0].url;

  chrome.storage.local.get(urlKey, function (result) {
    if (Object.keys(result).length !== 0) {
      data = result[urlKey];

      if (!data.tabData.malicious) {
        printAlert(data, "phishing");
      } else {
        printAlert(data, "malicious");
      }
    } else {
      printSafeData();
    }
  });
});

document.getElementById("reportButton").addEventListener("click", () => {
  hideInitComponent();
  showFullReport();
});

function showDetails() {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: "showReport" });
  });
}
