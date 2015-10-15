Package.describe({
  name: 'hazio:counter-cache',
  summary: "Cache the counts of an associated collection",
  version: "0.0.3",
  git: "https://github.com/hazio/meteor-counter-cache.git"
});

Package.onUse(function(api) {
  api.use([
    'check@1.0.0',
    'underscore@1.0.0',
    'mongo@1.0.6',
    'minimongo@1.0.10'
  ]);
  api.add_files('counter-cache.js', ['client', 'server']);
  api.export('CounterCache');
});

Package.onTest(function(api) {
  api.use(['tinytest', 'dburles:counter-cache']);
  api.add_files('counter-cache_tests.js', 'server');
});
