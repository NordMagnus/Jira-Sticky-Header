let page = document.getElementById('buttonDiv');
const kButtonColors = ['#3aa757', '#e8453c', '#f9bb2d', '#4688f1'];
let urlListEl = document.getElementById('urlList');
urlListEl.addEventListener('blur', () => {
  chrome.storage.sync.set({ jiraUrls: urlListEl.value }, () => {
    console.log('Set URLs to: ' + urlListEl.value);
  });
});
