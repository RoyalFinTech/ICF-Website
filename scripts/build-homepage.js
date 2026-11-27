'use strict';
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const VIEWS = path.join(ROOT, 'views');
const INCLUDE = /<!-- ICF_INCLUDE:([a-z0-9/_-]+) -->/g;
function buildHomepage() {
  const template = fs.readFileSync(path.join(VIEWS, 'index.html'), 'utf8');
  const html = template.replace(INCLUDE, function (_match, key) {
    const file = path.resolve(VIEWS, key + '.html');
    if (!file.startsWith(VIEWS + path.sep)) throw new Error('Invalid homepage partial path: ' + key);
    return fs.readFileSync(file, 'utf8');
  });
  if (/<!-- ICF_INCLUDE:/.test(html)) throw new Error('Homepage contains an unresolved partial include.');
  return html;
}
if (require.main === module) {
  const output = path.join(ROOT, 'index.html');
  fs.writeFileSync(output, buildHomepage(), 'utf8');
  process.stdout.write('Built ' + path.relative(ROOT, output) + '\n');
}
module.exports = buildHomepage;
