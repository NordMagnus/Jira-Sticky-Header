
/*
 * Console logging
 */
console.info("%cRunning JIRA STICKY HEADER Chrome extension", "font-weight: bold; color: #0088ff; background-color: #e8f8ff;");
console.info(`%cExtension version: ${chrome.runtime.getManifest().version}`, "color: #0088ff; background-color: #e8f8ff;");

/*
 * Enable DEV_MODE when running locally (unpublished)
 */
let DEV_MODE = !('update_url' in chrome.runtime.getManifest());

/*
 * CSS classes used to identify elements.
 */
const ISSUE_HEADER_CLASS = 'issue-header-content';
const SCROLL_CONTAINER_CLASS = 'issue-body-content';

/*
 * Global variables
 */
let issueHeaderObserver;    // The mutation observer used to track page changes
let y0 = 0;                 // Initial offset of scrolled element used to toggle shadow on/off

DEV_MODE && console.info("%cRunning in developer mode, enabling debugging",
    "color: #a02820; background-color: #ffe8d8;");

/**
 * Scroll listener to draw drop shadow when not at top of page.
 * 
 * If a header exists on page it looks for the scrolling container and compares
 * its bounding rect top value to the initial offset set when page is loaded.
 * 
 * @param {Object} e Event object
 */
const scrollListener = (e) => {
  const header = findHeader();
  if (!header) {
    return;
  }

  const issueContentEl = document.getElementsByClassName(SCROLL_CONTAINER_CLASS);
  if (issueContentEl.length === 0) {
    DEV_MODE && console.error('Could not find issue-view');
    return;
  }
  const scrolledEl = issueContentEl[0];

  const yPos = scrolledEl.getBoundingClientRect().top;
  if (yPos < y0) {
    header.classList.add('shadow');
  } else {
    header.classList.remove('shadow');
  }
}

/**
 * Initial check for an issue header and sets up a mutation observer to track page changes. The 
 * latter is needed e.g. in detailed list views when you can switch between issues without reloading
 * the page.
 * 
 * Called from the ready state event listener.
 */
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

/**
 * Tries to find an issue header.
 * 
 * @returns Undefined if not find otherwise the first (should only be one) element found
 */
function findHeader() {
  const el = document.getElementsByClassName(ISSUE_HEADER_CLASS);
  if (el.length === 0) {
    return undefined;
  }
  return el[0];
}

/**
 * Tries to find a container that is scrolled. This could be either the issue view (when
 * presenting one issue) or the detail panel (when presenting a filter/list).
 * 
 * @returns undefined if no container found otherwise the first element found
 */
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

/**
 * Does the plumbing making the header sticky and attaches an event listener to the
 * scrolled container.
 */
function setupHeader() {
  DEV_MODE && console.log('An issue header was added!');
  const el = document.getElementsByClassName(ISSUE_HEADER_CLASS)[0];
  makeHeaderSticky(el);

  /*
   * Set y0 to the initial offset of the scroll container element
   */
  const issueContentEl = document.getElementsByClassName(SCROLL_CONTAINER_CLASS);
  if (issueContentEl.length === 0) {
    DEV_MODE && console.error('Could not find issue-view');
    return;
  }
  const scrolledEl = issueContentEl[0];
  y0 = scrolledEl.getBoundingClientRect().top;

  DEV_MODE && console.log('Adding scroll event listener');
  const containerEl = findContainer();
  containerEl.addEventListener('scroll', scrollListener);
}

/**
 * Attaches classes and adjusts z index of header to make it sticky.
 * 
 * @param {Element} el The header element
 */
function makeHeaderSticky(el) {
  const stalker = el.parentElement;
  console.assert(stalker.id === "stalker", "Parent is not a stalker 😱");
  stalker.classList.add('sticky-issue-header');
  el.classList.add('custom-issue-header');
  el.style.zIndex = '3';
}

// ====================================================================================
// This adds an event listener to the ready state calling checkForIssueHeader() when
// a page is loaded.
// ====================================================================================
document.addEventListener('readystatechange', event => {
  if (issueHeaderObserver) {
    issueHeaderObserver.disconnect();
  }
  if (event.target.readyState === 'complete') {
    console.log('Calling checkForIssueHeader()');
    checkForIssueHeader();
  }
});
