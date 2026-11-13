/* eslint-disable */
/* global WebImporter */

/**
 * Parser: hero (source `section.hero.alignfull`, subpages: `[no-image]` and `[has-image]`).
 *
 * Output (matches the home page hero model, blocks/hero/hero.js):
 *   block "Hero (subpage)" — plus option `wide` when the source content area is `[full]`
 *   row 1: background picture (from div[overlay] inline background-image)
 *   row 2: optional eyebrow <p> (span.dashed), <h1>, optional description <p>(s),
 *          optional CTA <p><a> (a.down-arrow-cta, text only), then the optional
 *          foreground photo (.image-wrapper img); the block renders it on the right.
 */

/** Read url(...) from an element's inline background-image style. */
function backgroundImage(document, el) {
  if (!el) return null;
  const style = el.getAttribute('style') || '';
  const m = style.match(/background-image\s*:\s*url\(\s*(['"]?)(.*?)\1\s*\)/i);
  if (!m || !m[2]) return null;
  const img = document.createElement('img');
  img.src = m[2];
  img.alt = '';
  return img;
}

export default function parse(element, { document }) {
  const cells = [];

  const bg = backgroundImage(document, element.querySelector(':scope > [overlay]') || element.querySelector('[overlay]'));
  if (bg) cells.push([bg]);

  const content = element.querySelector('.grid > .content') || element.querySelector('.content') || element;
  const contentCell = [];

  const eyebrow = content.querySelector('span.dashed');
  if (eyebrow && eyebrow.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = eyebrow.textContent.trim();
    contentCell.push(p);
  }

  const heading = content.querySelector('h1, h2');
  if (heading) {
    const h1 = document.createElement('h1');
    h1.textContent = heading.textContent.replace(/\s+/g, ' ').trim();
    contentCell.push(h1);
  }

  // description paragraphs directly in the content area
  [...content.querySelectorAll(':scope > p')].forEach((p) => {
    if (!p.textContent.trim() && !p.querySelector('img, a')) return;
    contentCell.push(p);
  });

  const cta = content.querySelector('a.down-arrow-cta');
  if (cta) {
    const text = cta.textContent.replace(/\s+/g, ' ').trim();
    if (text) {
      const a = document.createElement('a');
      a.href = cta.getAttribute('href') || '#';
      a.textContent = text;
      const p = document.createElement('p');
      p.append(a);
      contentCell.push(p);
    }
  }

  // foreground photo (has-image heroes)
  const photo = element.querySelector('.grid > .image-wrapper img') || element.querySelector('.image-wrapper img');
  if (photo && photo.getAttribute('src')) {
    const img = document.createElement('img');
    img.src = photo.getAttribute('src');
    img.alt = photo.getAttribute('alt') || '';
    contentCell.push(img);
  }

  cells.push([contentCell]);

  const options = ['subpage'];
  if (!photo && content.hasAttribute && content.hasAttribute('full')) options.push('wide');
  const block = WebImporter.Blocks.createBlock(document, { name: `Hero (${options.join(', ')})`, cells });
  element.replaceWith(block);
}
