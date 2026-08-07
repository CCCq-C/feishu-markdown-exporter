const button = document.querySelector("#export");
const status = document.querySelector("#status");

button.addEventListener("click", async () => {
  button.disabled = true;
  status.textContent = "正在读取并生成 Markdown…";
  const response = await chrome.runtime.sendMessage({ type: "export-current-tab" });
  if (response?.ok) {
    status.textContent = `已下载：${response.filename}`;
  } else {
    status.textContent = response?.error ?? "导出失败，请刷新文档后重试。";
  }
  button.disabled = false;
});
