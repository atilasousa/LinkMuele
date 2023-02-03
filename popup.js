let data = null;

function printData(data) {
  document.querySelector(".lds-ring").remove();
  document.querySelector(".data__safe").remove();
  document.querySelector(
    ".phishing__number"
  ).innerHTML = `${data.tabStats.phishing}`;
  document.querySelector(".phishing").innerHTML =
    "empresas classificaram está página como phishing";
  document.querySelector(
    ".malicious__number"
  ).innerHTML = `${data.tabStats.malicious}`;
  document.querySelector(".malicious").innerHTML =
    "empresas classificaram está página como malicioso";
}

function printSafeData() {
  document.querySelector(".lds-ring").remove();
  document.querySelector(".data__phishing").remove();
  document.querySelector(".data__malicious").remove();
  document.querySelector(".safe").innerHTML =
    "O site é seguro e não foi classificado como phishing ou malicioso";
}

chrome.storage.session.get(function (result) {
  if (Object.keys(result).length != 0) {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      const urlKey = tabs[0].url;

      if (Object.keys(result).includes(urlKey)) {
        data = result[urlKey];
        printData(data);
      } else {
        printSafeData();
      }
    });
  } else {
    printSafeData();
  }
});
