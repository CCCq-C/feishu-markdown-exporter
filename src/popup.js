const button = document.querySelector("#export");
const status = document.querySelector("#status");
const format = document.querySelector("#format");

button.addEventListener("click", async () => {
  button.disabled = true;
  format.disabled = true;
  const selectedFormat = format.value;
  status.textContent = `正在读取并生成 ${selectedFormat === "word" ? "Word" : "Markdown"}…`;
  const response = await chrome.runtime.sendMessage({ type: "export-current-tab", format: selectedFormat });
  if (response?.ok) {
    status.textContent = `已下载：${response.filename}`;
  } else {
    status.textContent = response?.error ?? "导出失败，请刷新文档后重试。";
  }
  button.disabled = false;
  format.disabled = false;
});
