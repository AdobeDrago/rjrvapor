/* eslint-disable */
/* global WebImporter */

/**
 * Parser: columns (source `section.image-with-content.alignfull > .container > .flex`).
 *
 * Output: "Columns (image-with-content, left|right)" -> class
 * `columns image-with-content left|right` (as in content/index.plain.html).
 * One row, cells in visual order:
 *   left  = [picture | text]
 *   right = [text | picture]
 *   no image = [text]
 * Text cell = h2 + paragraphs from .inner-content (nested .inner-content
 * flattened, empty <p> dropped).
 */
export default function parse(element, { document }) {
  const section = element.closest('section') || element;
  const side = section.hasAttribute('right') ? 'right' : 'left';

  // foreground image: direct child of .flex (not inside .content)
  const srcImg = element.querySelector(':scope > img')
    || [...element.querySelectorAll('img')].find((i) => !i.closest('.content'));
  let picture = null;
  if (srcImg && srcImg.getAttribute('src')) {
    picture = document.createElement('img');
    picture.src = srcImg.getAttribute('src');
    picture.alt = srcImg.getAttribute('alt') || '';
  }

  const content = element.querySelector(':scope > .content') || element.querySelector('.content') || element;
  const textCell = [];

  const heading = content.querySelector('h1, h2, h3');
  if (heading) {
    const h2 = document.createElement('h2');
    h2.innerHTML = heading.innerHTML.trim();
    textCell.push(h2);
  }

  // outermost .inner-content only; collect its block children, flattening nested wrappers
  const inner = [...content.querySelectorAll('.inner-content')].find((el) => !el.parentElement.closest('.inner-content'));
  const collect = (root) => {
    [...root.children].forEach((child) => {
      if (child.tagName === 'DIV') {
        collect(child);
        return;
      }
      if (child.tagName === 'P' && !child.textContent.trim() && !child.querySelector('img, a, br')) return;
      if (child.tagName === 'P' && !child.textContent.trim()) return;
      textCell.push(child);
    });
  };
  if (inner) collect(inner);

  let row;
  if (!picture) row = [textCell];
  else if (side === 'right') row = [textCell, picture];
  else row = [picture, textCell];

  const block = WebImporter.Blocks.createBlock(document, {
    name: `Columns (image-with-content, ${side})`,
    cells: [row],
  });
  element.replaceWith(block);
}
