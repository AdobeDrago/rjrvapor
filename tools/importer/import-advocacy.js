/* eslint-disable */
/* global WebImporter */

import heroParser from './parsers/hero.js';
import columnsParser from './parsers/columns.js';
import tableBorderedParser from './parsers/table-bordered.js';
import cleanupTransformer from './transformers/rjrvapor-cleanup.js';
import sectionsTransformer from './transformers/rjrvapor-sections.js';

const PAGE_TEMPLATE = {
  "name": "advocacy",
  "urls": [
    "https://www.rjrvapor.com/advocacy/",
    "https://www.rjrvapor.com/nydisclosures/",
    "https://www.rjrvapor.com/privacy-policy/",
    "https://www.rjrvapor.com/suppliers/",
    "https://www.rjrvapor.com/terms-and-conditions/",
    "https://www.rjrvapor.com/transforming-tobacco/",
    "https://www.rjrvapor.com/vapor/",
    "https://www.rjrvapor.com/who-we-are/",
    "https://www.rjrvapor.com/wvdisclosures/"
  ],
  "representativeUrl": "https://www.rjrvapor.com/advocacy/",
  "description": "Subpage with a grey hero band (title, optional eyebrow/photo) followed by body copy; some pages add alternating image-with-content rows or bordered data tables.",
  "blocks": [
    {
      "name": "hero",
      "instances": [
        "section.hero.alignfull[has-image]",
        "section.hero.alignfull[no-image]"
      ]
    },
    {
      "name": "columns",
      "instances": [
        "section.image-with-content.alignfull > .container > .flex"
      ]
    },
    {
      "name": "table-bordered",
      "instances": [
        "section.general-content.alignfull table"
      ]
    }
  ],
  "urlPattern": "/*",
  "sections": [
    {
      "id": "hero-image",
      "name": "Page hero with foreground photo",
      "selector": [
        "section.hero.alignfull[has-image]"
      ],
      "style": null,
      "blocks": [
        "hero"
      ],
      "defaultContent": []
    },
    {
      "id": "hero-centered",
      "name": "Page hero, centered title",
      "selector": [
        "section.hero.alignfull[no-image]:has(.content[center])"
      ],
      "style": "centered",
      "blocks": [
        "hero"
      ],
      "defaultContent": []
    },
    {
      "id": "hero-no-image",
      "name": "Page hero, no photo",
      "selector": [
        "section.hero.alignfull[no-image]:not(:has(.content[center]))"
      ],
      "style": null,
      "blocks": [
        "hero"
      ],
      "defaultContent": []
    },
    {
      "id": "image-with-content-grey",
      "name": "Image with content on grey",
      "selector": [
        "section.image-with-content.alignfull[has-bg]"
      ],
      "style": "image-with-content, grey",
      "blocks": [
        "columns"
      ],
      "defaultContent": []
    },
    {
      "id": "image-with-content",
      "name": "Image with content",
      "selector": [
        "section.image-with-content.alignfull:not([has-bg])"
      ],
      "style": "image-with-content",
      "blocks": [
        "columns"
      ],
      "defaultContent": []
    },
    {
      "id": "closing-grey",
      "name": "Closing statement band",
      "selector": [
        "section.general-content.alignfull[has-bg]"
      ],
      "style": "disclaimer",
      "blocks": [],
      "defaultContent": [
        "section.general-content.alignfull[has-bg] > .container"
      ]
    },
    {
      "id": "body",
      "name": "Body copy",
      "selector": [
        "section.general-content.alignfull:not([has-bg])"
      ],
      "style": null,
      "blocks": [
        "table-bordered"
      ],
      "defaultContent": [
        "section.general-content.alignfull:not([has-bg]) > .container"
      ]
    }
  ]
};

const parsers = {
  'hero': heroParser,
  'columns': columnsParser,
  'table-bordered': tableBorderedParser,
};
// Late transformers change the DOM (section <hr> markers, shared fragments), so their beforeTransform
// runs after block discovery.
const sectionTransformers = [sectionsTransformer];
const fragmentTransformers = [];
const lateTransformers = [...sectionTransformers, ...fragmentTransformers];
const transformers = [cleanupTransformer, ...lateTransformers];
const earlyTransformers = transformers.filter((fn) => !lateTransformers.includes(fn));
// Catalog selectors (pageInstances, pageCleanup) count the <script> and <hr> elements the importer
// removes before transform, so a catalog template finds its targets in preprocess.
const CATALOG = Boolean(PAGE_TEMPLATE.pageCleanup || PAGE_TEMPLATE.blocks.some((b) => b.pageInstances));

function executeTransformers(hookName, element, payload, list = transformers) {
  const enhancedPayload = { ...payload, template: payload.params?.targets?.template || PAGE_TEMPLATE };
  list.forEach((fn) => {
    try { fn(hookName, element, enhancedPayload); }
    catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
  });
}

function findBlocksOnPage(document, template, url) {
  const pageBlocks = [];
  const pageKey = (u) => {
    try { const { origin, pathname } = new URL(u); return `${origin}${pathname.replace(/\/$/, '')}`; }
    catch { return u; }
  };
  const key = pageKey(url);
  const claim = (blockDef, selector) => {
    let matches = [];
    try { matches = document.querySelectorAll(selector); } catch { return; }
    matches.forEach((element) => {
      if (pageBlocks.some((b) => b.element === element || b.element.contains(element) || element.contains(b.element))) return;
      pageBlocks.push({ name: blockDef.name, selector, element });
    });
  };
  template.blocks.forEach((blockDef) => {
    const entry = Object.entries(blockDef.pageInstances || {}).find(([u]) => pageKey(u) === key);
    (entry ? entry[1] : []).forEach((selector) => claim(blockDef, selector));
  });
  template.blocks.forEach((blockDef) => (blockDef.instances || []).forEach((selector) => claim(blockDef, selector)));
  return pageBlocks;
}

// Runs the early transformers, then marks each block and section target with an attribute: the
// importer re-creates the body before transform, so only attributes survive, not element references.
// Every element matching a section selector is marked (not only the first), because section types
// repeat on a page (e.g. five image-with-content sections on /transforming-tobacco/).
function markPageTargets(payload) {
  const { document, params } = payload;
  executeTransformers('beforeTransform', document.body, payload, earlyTransformers);
  const blocks = findBlocksOnPage(document, PAGE_TEMPLATE, params.originalURL).map(({ name, selector, element }, i) => {
    element.setAttribute('data-excat-block', String(i));
    return { name, selector };
  });
  const sections = (PAGE_TEMPLATE.sections || []).map((section, i) => {
    const sel = (section.selector || []).find((s) => {
      try { return document.querySelector(s); } catch { return false; }
    });
    if (!sel) return section;
    document.querySelectorAll(sel).forEach((target) => {
      if (!target.hasAttribute('data-excat-section')) target.setAttribute('data-excat-section', String(i));
    });
    return { ...section, selector: [`[data-excat-section="${i}"]`] };
  });
  params.targets = { blocks, template: { ...PAGE_TEMPLATE, sections } };
}

export default {
  preprocess: (payload) => {
    if (CATALOG) markPageTargets(payload);
  },
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;
    params.fragments = [];

    if (!params.targets) markPageTargets(payload);
    const pageBlocks = params.targets.blocks
      .map((block, i) => ({ ...block, element: document.querySelector(`[data-excat-block="${i}"]`) }))
      .filter((block) => block.element);
    executeTransformers('beforeTransform', main, { ...payload, pageBlocks }, lateTransformers);

    pageBlocks.forEach((block) => {
      if (!main.contains(block.element)) return;
      const parser = parsers[block.name];
      if (!parser) return;
      try { parser(block.element, { document, url, params }); }
      catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
    });

    executeTransformers('afterTransform', main, payload);

    main.appendChild(document.createElement('hr'));
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // A fragment's nodes left `main` before afterTransform: finalize it the same way, without the
    // page-only section breaks and metadata.
    params.fragments.forEach(({ element }) => {
      executeTransformers('afterTransform', element, payload, earlyTransformers);
      WebImporter.rules.transformBackgroundImages(element, document);
      WebImporter.rules.adjustImageUrls(element, url, params.originalURL);
    });

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }, ...params.fragments];
  },
};
