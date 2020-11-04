chrome.runtime.onInstalled.addListener(function () {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
    chrome.declarativeContent.onPageChanged.addRuels([{
      conditions: [new chrome.declarativeContent.PageStateMatcher({
        pageUrl: { hostEquals: 'issues.cambio.se' },
      })
      ],
      actions: [new chrome.declarativeContent.ShowPageAction()],
    }]);
  });
});
