/*
 * Table (bordered): each block row is a table row, each cell a table cell.
 * The first row is the header row unless the `no-header` option is set.
 * Based on https://www.aem.live/developer/block-collection/table
 */

/**
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const header = !block.classList.contains('no-header') && rows.length > 1;
  const columnCount = Math.max(...rows.map((row) => row.children.length || 1));

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  rows.forEach((row, i) => {
    const tr = document.createElement('tr');
    const isHeader = i === 0 && header;
    const cells = row.children.length ? [...row.children] : [row];

    cells.forEach((cell, j) => {
      const td = document.createElement(isHeader ? 'th' : 'td');
      if (isHeader) td.setAttribute('scope', 'col');
      td.append(...cell.childNodes);
      // short rows: let the last cell span the remaining columns
      if (j === cells.length - 1 && cells.length < columnCount) {
        td.colSpan = columnCount - cells.length + 1;
      }
      tr.append(td);
    });

    if (isHeader) thead.append(tr);
    else tbody.append(tr);
  });

  if (thead.children.length) table.append(thead);
  table.append(tbody);

  // horizontal scroll container for narrow viewports
  const scroller = document.createElement('div');
  scroller.className = 'table-bordered-scroll';
  scroller.tabIndex = 0;
  scroller.setAttribute('role', 'region');
  scroller.setAttribute('aria-label', 'Table');
  scroller.append(table);

  block.replaceChildren(scroller);
}
