chrome.runtime.sendMessage(
  { type: "runtime", url: location.href },
  (response) => {
    console.log(response);
  }
);
