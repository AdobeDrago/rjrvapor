/* eslint-disable */
/* global WebImporter */

/**
 * rjrvapor.com (WordPress) cleanup transformer.
 *
 * beforeTransform: strip site chrome and non-authorable widgets, and fix
 * default content that parsers should see clean (hero CTA, list prefixes).
 * The hero decorative background (div[overlay] / background-aside.png) is
 * intentionally left untouched so the hero parsers can read it.
 *
 * afterTransform: final removal of leftover non-content elements.
 * HTML comments are NOT removed here (field hints may live in comments).
 */

const CHROME_SELECTORS = [
  // skip links
  'a.skip-link',
  '#wp-skip-link',
  '.screen-reader-text.skip-link',
  // site header / nav
  'header.wp-block-template-part',
  'header.banner',
  'nav.nav-primary',
  'nav.nav-mobile',
  // site footer
  'footer.wp-block-template-part',
  'footer.footer',
  // cookie / consent UI (OneTrust)
  '#onetrust-consent-sdk',
  '#onetrust-banner-sdk',
  '#onetrust-pc-sdk',
  '#ot-sdk-btn-floating',
  '.onetrust-pc-dark-filter',
  '.ot-sdk-show-settings',
];

const NON_CONTENT_SELECTORS = [
  'script',
  'style',
  'noscript',
  'link',
  'iframe',
];

const CTA_TARGET = '#delivering-superior-performance-through-technology';

function removeAll(root, selectors) {
  selectors.forEach((sel) => {
    root.querySelectorAll(sel).forEach((el) => el.remove());
  });
}

/** Return the first text node under `el` that has non-whitespace content. */
function firstTextNode(el) {
  const doc = el.ownerDocument;
  const walker = doc.createTreeWalker(el, 4 /* NodeFilter.SHOW_TEXT */);
  let node = walker.nextNode();
  while (node) {
    if (node.nodeValue && node.nodeValue.trim()) return node;
    node = walker.nextNode();
  }
  return null;
}

/** Strip a leading literal bullet character typed into <li> text. */
function stripLiteralBullets(root) {
  root.querySelectorAll('li').forEach((li) => {
    const tn = firstTextNode(li);
    if (tn && /^\s*•/.test(tn.nodeValue)) {
      tn.nodeValue = tn.nodeValue.replace(/^\s*•[\s ]*/, '');
    }
  });
}

/** On <ol>, strip "N. " prefixes that duplicate the list's own numbering. */
function stripDuplicateOlNumbers(root) {
  root.querySelectorAll('ol').forEach((ol) => {
    const start = parseInt(ol.getAttribute('start'), 10);
    let n = Number.isNaN(start) ? 1 : start;
    [...ol.children].forEach((li) => {
      if (li.tagName !== 'LI') return;
      const tn = firstTextNode(li);
      if (tn) {
        const re = new RegExp(`^\\s*${n}\\.[\\s\\u00a0]+`);
        if (re.test(tn.nodeValue)) tn.nodeValue = tn.nodeValue.replace(re, '');
      }
      n += 1;
    });
  });
}

/** Hero "We are doing this by" CTA: drop hidden arrow img, fix anchor. */
function fixDownArrowCta(root) {
  root.querySelectorAll('a.down-arrow-cta').forEach((a) => {
    a.querySelectorAll('img').forEach((img) => img.remove());
    const href = a.getAttribute('href') || '';
    if (/(^|\/transforming-tobacco\/?)#section-0$/.test(href)) {
      a.setAttribute('href', CTA_TARGET);
    }
    // collapse whitespace left behind by the removed image
    const tn = firstTextNode(a);
    if (tn) tn.nodeValue = tn.nodeValue.replace(/\s+$/, '');
  });
}

export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
    removeAll(element, CHROME_SELECTORS);
    // inline <style> (e.g. trailing one on disclosure pages), scripts, etc.
    removeAll(element, NON_CONTENT_SELECTORS);

    fixDownArrowCta(element);
    stripLiteralBullets(element);
    stripDuplicateOlNumbers(element);
  }

  if (hookName === 'afterTransform') {
    removeAll(element, CHROME_SELECTORS);
    removeAll(element, NON_CONTENT_SELECTORS);

    // strip tracking / inline handler attributes
    element.querySelectorAll('*').forEach((el) => {
      [...el.attributes].forEach((attr) => {
        const name = attr.name.toLowerCase();
        if (name.startsWith('on') || name.startsWith('data-gtm') || name.startsWith('data-ga')) {
          el.removeAttribute(attr.name);
        }
      });
    });
  }
}
