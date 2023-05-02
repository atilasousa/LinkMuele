chrome.runtime.sendMessage({ type: "runtime", url: location.href }, () => {
  return true;
});

let openModal = false;

let modal = null;

const runtimeHandler = (message, sender, sendResponse) => {
  if (message.action === "open_modal") {
    showModal();
  } else if (message.action === "showReport") {
    console.log(message);
    showModal(true);
  }

  sendResponse();
};

const showModal = (report = null) => {
  const linkMueleModal = document.getElementById("linkMueleModal");

  if (linkMueleModal) {
    linkMueleModal.remove();
    openModal = false;
    return;
  }

  modal = document.createElement("dialog");
  modal.setAttribute("id", "linkMueleModal");

  modal.setAttribute(
    "style",
    `
      position: fixed;
      height:450px;
      width: 800px;
      border: none;
      top:15px;
      right:15px;
      padding:0;
      border-radius:10px;
      background-color:white;
      box-shadow: 0px 12px 48px rgba(29, 5, 64, 0.32);
      overflow: hidden;
    `
  );

  modal.innerHTML = `
  <div style="width:100%; height: 100%; padding: 0; margin: 0; margin-bottom: 0.7rem">
    <iframe id="popup-content" style="height:100%; width:100%; padding-top:0;"></iframe>
  </div>
  `;
  document.body.appendChild(modal);
  const dialog = document.querySelector("dialog");
  dialog.showModal();
  const iframe = document.getElementById("popup-content");
  iframe.src = chrome.runtime.getURL("popup.html");
  iframe.frameBorder = 0;

  openModal = true;
};

// chrome.runtime.onMessage.removeListener(runtimeHandler);

chrome.runtime.onMessage.addListener(runtimeHandler);
