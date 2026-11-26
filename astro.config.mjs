import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const CALLOUT_ICONS = {
  note: [
    ['circle', { cx: '12', cy: '12', r: '9' }],
    ['path', { d: 'M12 16v-4M12 8h.01' }],
  ],
  tip: [
    ['path', { d: 'M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0012 2z' }],
  ],
  important: [
    ['path', { d: 'M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z' }],
    ['path', { d: 'M12 8v4M12 16h.01' }],
  ],
  warning: [
    ['path', { d: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' }],
    ['path', { d: 'M12 9v4M12 17h.01' }],
  ],
  caution: [
    ['polygon', { points: '7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2' }],
    ['path', { d: 'M12 8v4M12 16h.01' }],
  ],
};

function rehypeCallouts() {
  const walk = (node) => {
    if (!node.children) return;
    for (const child of node.children) walk(child);
    if (node.type !== 'element' || node.tagName !== 'blockquote') return;

    const firstElIdx = node.children.findIndex((c) => !(c.type === 'text' && /^\s*$/.test(c.value)));
    const firstEl = node.children[firstElIdx];
    if (!firstEl || firstEl.type !== 'element' || firstEl.tagName !== 'p') return;

    const firstChild = firstEl.children?.[0];
    if (!firstChild || firstChild.type !== 'text') return;

    const m = firstChild.value.match(/^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:[ \t]*\r?\n|[ \t]+|$)/i);
    if (!m) return;

    const kind = m[1].toLowerCase();
    firstChild.value = firstChild.value.slice(m[0].length);
    if (firstChild.value === '') firstEl.children.shift();
    if (firstEl.children[0]?.type === 'element' && firstEl.children[0].tagName === 'br') {
      firstEl.children.shift();
    }
    if (firstEl.children[0]?.type === 'text') {
      firstEl.children[0].value = firstEl.children[0].value.replace(/^\r?\n/, '');
    }
    if (firstEl.children.length === 0) {
      node.children.splice(firstElIdx, 1);
    }

    const svgChildren = CALLOUT_ICONS[kind].map(([tagName, properties]) => ({
      type: 'element',
      tagName,
      properties,
      children: [],
    }));

    node.tagName = 'aside';
    node.properties = { className: ['callout', `callout-${kind}`], role: 'note' };
    node.children = [
      {
        type: 'element',
        tagName: 'div',
        properties: { className: ['callout-head'] },
        children: [
          {
            type: 'element',
            tagName: 'svg',
            properties: {
              className: ['i'],
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: 'currentColor',
              'stroke-width': '1.7',
              'stroke-linecap': 'round',
              'stroke-linejoin': 'round',
              'aria-hidden': 'true',
            },
            children: svgChildren,
          },
          {
            type: 'element',
            tagName: 'span',
            properties: {},
            children: [{ type: 'text', value: kind.toUpperCase() }],
          },
        ],
      },
      {
        type: 'element',
        tagName: 'div',
        properties: { className: ['callout-body'] },
        children: node.children,
      },
    ];
  };
  return (tree) => walk(tree);
}

export default defineConfig({
  site: 'https://bachns.io.vn',
  integrations: [sitemap()],
  markdown: {
    rehypePlugins: [rehypeCallouts],
    shikiConfig: {
      theme: 'github-dark-dimmed',
      wrap: false,
      transformers: [{ pre(node) { node.properties['data-lang'] = this.options.lang; } }],
    },
  },
});
