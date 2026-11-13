/* eslint-disable */
/* global WebImporter */

/**
 * rjrvapor.com sections transformer.
 *
 * Uses payload.template.sections. A section type can occur several times on
 * one page (e.g. five image-with-content sections on /transforming-tobacco/),
 * so every element matched by a section's selectors becomes its own EDS
 * section.
 *
 * beforeTransform: insert <hr> before every non-first matched section element
 * (in document order). Styled sections get their <hr> marked with
 * data-excat-section-id / data-excat-section-style; a styled first section
 * gets a temporary marked <hr> that is removed in afterTransform.
 *
 * afterTransform: for each marker, append a Section Metadata block at the end
 * of that section (just before the next <hr>, or at the end of the parent).
 *
 * Conditional rule (mapping-notes.json): the "body" section gets style
 * "centered" only when its .container holds exactly one <p> and nothing else
 * meaningful (source CSS: .general-content p:only-child { text-align:center }).
 */

const MARKER_ATTR = 'data-excat-section-id';
const STYLE_ATTR = 'data-excat-section-style';
const FIRST_ATTR = 'data-excat-section-first';

function queryFirstSelector(root, selectors) {
  const list = Array.isArray(selectors) ? selectors : [selectors];
  for (let i = 0; i < list.length; i += 1) {
    try {
      const found = [...root.querySelectorAll(list[i])];
      if (found.length) return found;
    } catch (e) {
      // invalid selector in this engine; try next
    }
  }
  return [];
}

/** Body section: centered only if .container has exactly one <p>, nothing else. */
function isSingleParagraphBody(sectionEl) {
  const container = sectionEl.querySelector(':scope > .container') || sectionEl;
  const children = [...container.children];
  if (children.length !== 1 || children[0].tagName !== 'P') return false;
  // no stray meaningful text outside the <p>
  const strayText = [...container.childNodes]
    .filter((n) => n.nodeType === 3)
    .map((n) => n.nodeValue.replace(/ /g, ' ').trim())
    .join('');
  return strayText === '';
}

function resolveStyle(section, el) {
  if (section.id === 'body') {
    return isSingleParagraphBody(el) ? 'centered' : null;
  }
  return section.style || null;
}

export default function transform(hookName, element, payload) {
  const template = payload && payload.template;
  const sections = template && template.sections;
  if (!Array.isArray(sections) || sections.length < 2) return;
  const doc = element.ownerDocument;

  if (hookName === 'beforeTransform') {
    // collect every matched section element, first match wins per element
    const seen = new Set();
    const matches = [];
    sections.forEach((section) => {
      queryFirstSelector(element, section.selector).forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        matches.push({ section, el });
      });
    });

    // drop elements nested in another matched section
    const top = matches.filter(({ el }) => !matches.some((m) => m.el !== el && m.el.contains(el)));

    // document order
    top.sort((a, b) => {
      if (a.el === b.el) return 0;
      // 4 = DOCUMENT_POSITION_FOLLOWING
      return a.el.compareDocumentPosition(b.el) & 4 ? -1 : 1;
    });

    // walk reverse, insert breaks while parser targets still exist
    for (let i = top.length - 1; i >= 0; i -= 1) {
      const { section, el } = top[i];
      const style = resolveStyle(section, el);
      if (i === 0 && !style) continue;
      const hr = doc.createElement('hr');
      if (style) {
        hr.setAttribute(MARKER_ATTR, section.id);
        hr.setAttribute(STYLE_ATTR, style);
      }
      if (i === 0) hr.setAttribute(FIRST_ATTR, 'true');
      el.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    const markers = [...element.querySelectorAll(`hr[${MARKER_ATTR}]`)];
    for (let i = markers.length - 1; i >= 0; i -= 1) {
      const hr = markers[i];
      const style = hr.getAttribute(STYLE_ATTR);
      const isFirst = hr.getAttribute(FIRST_ATTR) === 'true';

      if (style) {
        const meta = WebImporter.Blocks.createBlock(doc, {
          name: 'Section Metadata',
          cells: { style },
        });
        // end of this section = just before the next <hr> sibling
        let next = hr.nextElementSibling;
        while (next && next.tagName !== 'HR') next = next.nextElementSibling;
        if (next) next.before(meta);
        else hr.parentElement.append(meta);
      }

      if (isFirst) {
        hr.remove();
      } else {
        hr.removeAttribute(MARKER_ATTR);
        hr.removeAttribute(STYLE_ATTR);
      }
    }
  }
}
