/* global chrome */

console.info("%cRunning JIRA STICKY HEADER Chrome extension", "font-weight: bold; color: #0088ff; background-color: #e8f8ff;");
console.info(`%cExtension version: ${chrome.runtime.getManifest().version}`, "color: #0088ff; background-color: #e8f8ff;");

let DEV_MODE = !('update_url' in chrome.runtime.getManifest());
const ISSUE_HEADER_CLASS = 'issue-header-content';

let issueHeaderObserver;
let y0 = 0;

if (DEV_MODE) {
    console.info("%cRunning in developer mode, enabling debugging",
            "color: #a02820; background-color: #ffe8d8;");
}

/**
 * Scroll listener to draw drop shadow when not at top of page.
 * 
 * @param {Object} e Event object
 */
const scrollListener = (e) => {
  const header = findHeader();
  if (!header) {
    return;
  }

  const issueContentEl = document.getElementsByClassName('issue-body-content');
  if (issueContentEl.length === 0) {
    console.error('Could not find issue-view');
    return;
  }
  const scrolledEl = issueContentEl[0];

  const yPos = scrolledEl.getBoundingClientRect().top;
  // console.log({ yPos });
  if (yPos < y0) {
    header.classList.add('shadow');
  } else {
    header.classList.remove('shadow');
  }
}

function checkForIssueHeader() {
  const jiraEl = document.getElementById('jira');
  if (!jiraEl) {
    console.log('This does not seem to be a Jira page, bailing...');
    return;
  }

  console.log('Creating mutation observer');
  /*
   * Set up mutation observer to spot when an issue header is added to page
   */
  issueHeaderObserver = new MutationObserver((mutations) => {
    for (let m of mutations) {
      if (m.addedNodes.length === 1 && m.target.id === 'summary-val') {
        setupHeader();
      }
    }
  });

  let conf = {
    attributes: false,
    childList: true,
    characterData: false,
    subtree: true,
  };
  issueHeaderObserver.observe(jiraEl, conf);

  /*
   * Check if header already exists.
   */
  const el = findHeader();
  if (!el) {
    return;
  }
  setupHeader();
}

function findHeader() {
  const el = document.getElementsByClassName(ISSUE_HEADER_CLASS);
  if (el.length === 0) {
    return undefined;
  }
  return el[0];
}

function findContainer() {
  let containerEl;
  
  containerEl = document.getElementsByClassName('issue-view');
  if (containerEl.length === 0) {
    containerEl = document.getElementsByClassName('detail-panel');
  }

  if (containerEl.length === 0) {
    return undefined;
  }

  return containerEl[0];
}

function setupHeader() {
  console.log('An issue header was added!');
  const el = document.getElementsByClassName(ISSUE_HEADER_CLASS)[0];
  makeHeaderSticky(el);

  /*
   * Set y0 to the initial offset of issue-body-content
   */
  const issueContentEl = document.getElementsByClassName('issue-body-content');
  if (issueContentEl.length === 0) {
    console.error('Could not find issue-view');
    return;
  }
  const scrolledEl = issueContentEl[0];
  y0 = scrolledEl.getBoundingClientRect().top;

  console.log('Adding scroll event listener');
  const containerEl = findContainer();
  containerEl.addEventListener('scroll', scrollListener);
}

function makeHeaderSticky(el) {
  const stalker = el.parentElement;
  console.assert(stalker.id === "stalker", "Parent is not a stalker 😱");
  stalker.classList.add('sticky-issue-header');
  el.classList.add('custom-issue-header');
  el.style.zIndex = '3';
}

document.addEventListener('readystatechange', event => {
  if (issueHeaderObserver) {
    issueHeaderObserver.disconnect();
  }
  if (event.target.readyState === 'complete') {
    console.log('Calling checkForIssueHeader()');
    checkForIssueHeader();
  }
});
