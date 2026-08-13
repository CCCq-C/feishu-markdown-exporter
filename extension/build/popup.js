// src/popup.js
var button = document.querySelector("#export");
var status = document.querySelector("#status");
var format = document.querySelector("#format");
button.addEventListener("click", async () => {
  button.disabled = true;
  format.disabled = true;
  const selectedFormat = format.value;
  status.textContent = `\u6B63\u5728\u8BFB\u53D6\u5E76\u751F\u6210 ${selectedFormat === "word" ? "Word" : "Markdown"}\u2026`;
  const response = await chrome.runtime.sendMessage({ type: "export-current-tab", format: selectedFormat });
  if (response?.ok) {
    status.textContent = `\u5DF2\u4E0B\u8F7D\uFF1A${response.filename}`;
  } else {
    status.textContent = response?.error ?? "\u5BFC\u51FA\u5931\u8D25\uFF0C\u8BF7\u5237\u65B0\u6587\u6863\u540E\u91CD\u8BD5\u3002";
  }
  button.disabled = false;
  format.disabled = false;
});
