import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  const container = document.createElement('div');
  container.className = 'footer-container';
  // flatten the fragment's sections into one container: link list, then copyright
  fragment.querySelectorAll(':scope > div > div, :scope > .section > div').forEach((wrap) => {
    container.append(...wrap.children);
  });
  if (!container.children.length) {
    while (fragment.firstElementChild) container.append(fragment.firstElementChild);
  }
  // DA serves list links as <li><p><a>: unwrap
  container.querySelectorAll('li > p').forEach((p) => p.replaceWith(...p.childNodes));
  footer.append(container);

  block.append(footer);
}
