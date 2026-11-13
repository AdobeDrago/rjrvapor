/* eslint-disable */
/* global WebImporter */

/**
 * Parser: table-bordered (source `section.general-content.alignfull table`).
 *
 * Each <tr> becomes a block row, each <td>/<th> a cell (inline strong/br/links kept).
 * The first row is the header when all its non-empty cells are fully bold;
 * otherwise (e.g. first /privacy-policy/ table, bold labels in column 1)
 * the "no-header" option is added. width attributes are dropped.
 */

/** Is all visible text of the cell inside <strong>/<b> (or a <th>)? */
function isBoldCell(cell) {
  if (cell.tagName === 'TH') return true;
  const total = cell.textContent.replace(/\s+/g, '');
  if (!total) return true;
  const bold = [...cell.querySelectorAll('strong, b')]
    .filter((el) => !el.parentElement.closest('strong, b'))
    .map((el) => el.textContent)
    .join('')
    .replace(/\s+/g, '');
  return bold.length === total.length;
}

export default function parse(element, { document }) {
  const rows = [...element.querySelectorAll('tr')].filter((tr) => tr.closest('table') === element);

  const cells = rows.map((tr) => [...tr.children]
    .filter((c) => c.tagName === 'TD' || c.tagName === 'TH')
    .map((c) => {
      c.removeAttribute('width');
      c.querySelectorAll('[width]').forEach((el) => {
        if (el.tagName !== 'IMG') el.removeAttribute('width');
      });
      // drop empty paragraphs (WordPress artifacts like <p></p>)
      c.querySelectorAll('p').forEach((p) => {
        if (!p.textContent.trim() && !p.querySelector('img, a, br')) p.remove();
      });
      return [...c.childNodes];
    }));

  // pad uneven rows to the widest row
  const width = Math.max(1, ...cells.map((r) => r.length));
  cells.forEach((r) => { while (r.length < width) r.push(''); });

  const firstCells = rows.length
    ? [...rows[0].children].filter((c) => c.tagName === 'TD' || c.tagName === 'TH')
    : [];
  const hasText = firstCells.some((c) => c.textContent.trim());
  const header = rows.length > 1 && hasText && firstCells.every(isBoldCell);

  const block = WebImporter.Blocks.createBlock(document, {
    name: header ? 'Table Bordered' : 'Table Bordered (no-header)',
    cells,
  });
  element.replaceWith(block);
}
