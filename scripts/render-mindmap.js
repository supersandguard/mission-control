const { Transformer } = require('markmap-lib');
const fs = require('fs');

const markdown = fs.readFileSync('/tmp/sense-ending-mindmap.md', 'utf8');
const transformer = new Transformer();
const { root, features } = transformer.transform(markdown);
const { scripts, styles } = transformer.getUsedAssets(features);

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>A Sense of an Ending - Mindmap</title>
<style>
  html, body, #mindmap { width: 100%; height: 100%; margin: 0; padding: 0; }
  body { background: #1a1a2e; }
</style>
${(styles || []).map(s => {
  if (s.type === 'stylesheet') return `<link rel="stylesheet" href="${s.data.href}">`;
  return '';
}).join('\n')}
</head>
<body>
<svg id="mindmap" style="width: 1400px; height: 900px;"></svg>
${(scripts || []).map(s => {
  if (s.type === 'script' && s.data?.src) return `<script src="${s.data.src}"></script>`;
  return '';
}).join('\n')}
<script src="https://cdn.jsdelivr.net/npm/markmap-view@0.17.2/dist/browser/index.js"></script>
<script>
const { Markmap } = markmap;
const root = ${JSON.stringify(root)};
const mm = Markmap.create('#mindmap', {
  color: (node) => {
    const colors = ['#e94560', '#0f3460', '#16213e', '#533483', '#e94560', '#0f3460'];
    return colors[node.state.depth % colors.length];
  },
  paddingX: 16,
  autoFit: true,
  duration: 0,
  maxWidth: 250,
}, root);
</script>
</body>
</html>`;

fs.writeFileSync('/tmp/sense-ending-mindmap.html', html);
console.log('HTML mindmap saved');
console.log('Root children:', root.children?.length);
