const currentURL = window.location.href;

if (checkUrlInExcludeGlobs(currentURL)) setIcon(tabId, "safeIcon");
else
  chrome.runtime.sendMessage({ type: "runtime", url: location.href }, () => {
    return true;
  });

let openModal = false;
let modal = null;

const showModal = (report = null) => {
  const linkMueleModal = document.getElementById("linkMueleModal");

  if (linkMueleModal) {
    linkMueleModal.remove();
    openModal = false;
    return;
  }

  modal = document.createElement("dialog");
  modal.setAttribute("id", "linkMueleModal");
  modal.style.position = "fixed";
  modal.style.height = "450px";
  modal.style.width = "800px";
  modal.style.border = "none";
  modal.style.top = "15px";
  modal.style.right = "15px";
  modal.style.padding = "0";
  modal.style.borderRadius = "10px";
  modal.style.backgroundColor = "white";
  modal.style.boxShadow = "0px 12px 48px rgba(29, 5, 64, 0.32)";
  modal.style.overflow = "hidden";

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

const runtimeHandler = (message, sender, sendResponse) => {
  if (message.action === "open_modal") {
    showModal();
  } else if (message.action === "showReport") {
    console.log(message);
    showModal(true);
  }

  sendResponse();
};

chrome.runtime.onMessage.addListener(runtimeHandler);

function checkUrlInExcludeGlobs(url) {
  const manifest = chrome.runtime.getManifest();
  const excludeGlobs = manifest.content_scripts[0].exclude_globs;

  if (excludeGlobs && Array.isArray(excludeGlobs)) {
    console.log("entrei");

    const domain = new URL(url).hostname;

    const isExcluded = excludeGlobs.some((glob) => {
      const escapedGlob = glob.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escapedGlob);
      return regex.test(domain);
    });

    console.log(isExcluded);

    return isExcluded;
  }

  return false;
}
