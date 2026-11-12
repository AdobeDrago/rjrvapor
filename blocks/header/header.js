import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const isDesktop = window.matchMedia('(min-width: 900px)');

function closeAll(nav, except) {
  nav.querySelectorAll('.header-nav > li[aria-expanded="true"]').forEach((li) => {
    if (li !== except) li.setAttribute('aria-expanded', 'false');
  });
}

/**
 * Header: fixed banner with the brand logo and a one-level dropdown nav.
 * Nav fragment sections: 1 = brand link/logo, 2 = nav list (an item holding a nested list
 * is a dropdown; its label is plain text).
 * @param {Element} block
 */
export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);
  const [brandSection, navSection] = fragment ? [...fragment.children] : [];

  const banner = document.createElement('div');
  banner.className = 'header-banner';
  const container = document.createElement('div');
  container.className = 'header-container';

  const brand = document.createElement('a');
  brand.className = 'header-brand';
  const brandLink = brandSection && brandSection.querySelector('a');
  brand.href = brandLink ? brandLink.getAttribute('href') : '/';
  const pic = brandSection && brandSection.querySelector('picture');
  if (pic) brand.append(pic);
  const brandImg = brand.querySelector('img');
  if (brandImg) {
    brandImg.loading = 'eager';
    brand.setAttribute('aria-label', brandImg.alt || 'Home');
  }

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Main');
  const list = navSection && navSection.querySelector('ul');
  if (list) {
    list.className = 'header-nav';
    [...list.children].forEach((li) => {
      const sub = li.querySelector(':scope > ul');
      if (!sub) return;
      const label = li.querySelector(':scope > p') || li.firstChild;
      const trigger = document.createElement('a');
      trigger.href = '#';
      trigger.setAttribute('role', 'button');
      trigger.setAttribute('aria-haspopup', 'true');
      trigger.textContent = label ? label.textContent.trim() : '';
      if (label) label.replaceWith(trigger);
      sub.className = 'header-subnav';
      li.classList.add('header-dropdown');
      li.setAttribute('aria-expanded', 'false');
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const open = li.getAttribute('aria-expanded') === 'true';
        closeAll(nav, li);
        li.setAttribute('aria-expanded', open ? 'false' : 'true');
      });
      li.addEventListener('mouseenter', () => { if (isDesktop.matches) { closeAll(nav, li); li.setAttribute('aria-expanded', 'true'); } });
      li.addEventListener('mouseleave', () => { if (isDesktop.matches) li.setAttribute('aria-expanded', 'false'); });
    });
    // DA serves list links as <li><p><a>: unwrap so links sit directly in the item
    list.querySelectorAll('li > p').forEach((p) => p.replaceWith(...p.childNodes));
    nav.append(list);
  }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(nav); });

  container.append(brand, nav);
  banner.append(container);
  block.replaceChildren(banner);
}
