/**
 * Hero: row 1 = background image (rendered as a CSS background, like the source),
 * row 2 = eyebrow paragraph + heading.
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  const bgRow = rows.find((r) => r.querySelector('picture') && !r.querySelector('h1, h2'));
  const contentRow = rows.find((r) => r !== bgRow) || rows[0];

  const bg = document.createElement('div');
  bg.className = 'hero-background';
  const img = bgRow && bgRow.querySelector('img');
  if (img) bg.style.backgroundImage = `url("${img.currentSrc || img.src}")`;

  const content = document.createElement('div');
  content.className = 'hero-content';
  const cell = contentRow ? contentRow.querySelector(':scope > div') || contentRow : null;
  if (cell) content.append(...cell.childNodes);
  const eyebrow = content.querySelector('p');
  if (eyebrow && !eyebrow.querySelector('picture')) eyebrow.classList.add('hero-eyebrow');

  block.replaceChildren(bg, content);
}
