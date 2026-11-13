/* eslint-disable */
/* global WebImporter */

/**
 * Parser: columns, two-column text layout (source `section.two-column.alignfull > .container > .flex`,
 * e.g. /contact-us/).
 *
 * Output follows the EDS Columns convention: first row = block name, then one content row with
 * one cell per visual column, in visual order: [.left-side content | .right-side content].
 * A missing side is skipped, so a single side gives a one-cell row.
 */
export default function parse(element, { document }) {
  const sides = [
    element.querySelector(':scope > .left-side'),
    element.querySelector(':scope > .right-side'),
  ].filter(Boolean);
  const cols = sides.length ? sides : [...element.children];

  const row = cols
    .map((side) => [...side.children].filter((child) => {
      if (child.tagName !== 'P') return true;
      return child.textContent.replace(/ /g, ' ').trim() || child.querySelector('img, a, br');
    }))
    .filter((cell) => cell.length);

  if (!row.length) return;

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'Columns',
    cells: [row],
  });
  element.replaceWith(block);
}
