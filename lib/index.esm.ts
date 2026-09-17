// ESM entry point.
//
// `lib/index.ts` uses a TypeScript export assignment (`export = EasyEpoch`) so
// that `require('easyepoch')` and `import EasyEpoch = require('easyepoch')`
// keep working. That form cannot be compiled to an ES module at all — swc
// rejects it with "Export assignment cannot be used when targeting ECMAScript
// modules" — so the ESM bundle is built from this thin re-export instead.
//
// rspack compiles this file with `module.type: 'es6'` (see rspack.config.js)
// while the rest of lib/ stays CommonJS, which lets a single source tree
// produce both the CommonJS and the ES module bundles with no duplication.
import EasyEpoch from './index';

export default EasyEpoch;
