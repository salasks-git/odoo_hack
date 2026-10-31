// This entry point mounts Member 2 into Member 1's shared runtime.
// Point the environment variables at exports from the shared backend when it is ready.
const path = require('node:path');
const { createApp } = require('./index');

function loadExport(modulePath, name) {
  if (!modulePath) throw new Error(`Set the path to Member 1's shared module using ${name}`);
  const value = require(path.resolve(modulePath));
  return value.default || value;
}

try {
  const dbModule = loadExport(process.env.SHARED_DB_MODULE, 'SHARED_DB_MODULE');
  const authModule = loadExport(process.env.SHARED_AUTH_MODULE, 'SHARED_AUTH_MODULE');
  const discountModule = process.env.SHARED_DISCOUNT_MODULE ? require(path.resolve(process.env.SHARED_DISCOUNT_MODULE)) : {};
  const db = dbModule.db || dbModule;
  const app = createApp({ db, authenticate: authModule.authenticate, authorize: authModule.authorize, getDiscount: discountModule.getDiscount || (() => null) });
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => console.log(`Member 2 API listening on http://localhost:${port}/api`));
} catch (err) {
  console.error(`Member 2 server setup is incomplete: ${err.message}`);
  console.error('See docs/INTEGRATION.md for the shared database and authentication contract.');
  process.exitCode = 1;
}
