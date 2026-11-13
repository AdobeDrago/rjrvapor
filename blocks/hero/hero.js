/**
 * Is this paragraph a lone link (an authored call to action)?
 * @param {Element} p
 * @returns {boolean}
 */
function isLinkParagraph(p) {
  const links = p.querySelectorAll('a');
  return links.length === 1 && p.textContent.trim() === links[0].textContent.trim();
}

/**
 * Hero: row 1 = background image (rendered as a CSS background, like the source),
 * row 2 = optional eyebrow paragraph + heading, then optional description
 * paragraph(s), an optional link paragraph (call to action) and an optional
 * foreground picture. A foreground picture (same cell or a second cell) moves into
 * its own media column and the block gets `hero-has-media` (title left, photo right).
 * Options: `subpage` (shorter banner sized to its content), `wide` (full-width title).
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  const bgRow = rows.length > 1
    ? rows.find((r) => r.querySelector('picture') && !r.querySelector('h1, h2'))
    : null;
  const contentRows = rows.filter((r) => r !== bgRow);

  const bg = document.createElement('div');
  bg.className = 'hero-background';
  const img = bgRow && bgRow.querySelector('img');
  if (img) bg.style.backgroundImage = `url("${img.currentSrc || img.src}")`;

  const content = document.createElement('div');
  content.className = 'hero-content';
  contentRows.forEach((row) => {
    const cells = row.querySelector(':scope > div') ? [...row.children] : [row];
    cells.forEach((cell) => content.append(...cell.childNodes));
  });

  // foreground picture -> media column
  const media = document.createElement('div');
  media.className = 'hero-media';
  const picture = content.querySelector('picture');
  if (picture) {
    const wrapper = picture.parentElement;
    media.append(picture);
    if (wrapper !== content && !wrapper.textContent.trim() && !wrapper.children.length) {
      wrapper.remove();
    }
  }

  const heading = content.querySelector(':scope > h1, :scope > h2');
  const children = [...content.children];
  const headingIndex = children.indexOf(heading);
  children.forEach((p, i) => {
    if (p.tagName !== 'P') return;
    if (headingIndex < 0 || i < headingIndex) {
      // only the first paragraph before the heading is the eyebrow
      if (!content.querySelector('.hero-eyebrow')) p.classList.add('hero-eyebrow');
    } else if (isLinkParagraph(p)) {
      p.classList.add('hero-cta');
    } else {
      p.classList.add('hero-description');
    }
  });

  block.replaceChildren(bg, content);
  if (media.children.length) {
    block.classList.add('hero-has-media');
    block.append(media);
  }
}
