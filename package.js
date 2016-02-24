Package.describe({
  name: 'npvn:counter-cache',
  summary: "Cache the counts of an associated collection",
  version: "0.2.1",
  git: "https://github.com/npvn/meteor-counter-cache.git"
});

Package.onUse(function(api) {
  api.use([
    'check',
    'underscore@1.0.0',
    'mongo@1.0.6',
    'minimongo',
    'ejson',
    'ecmascript'
  ]);
  api.add_files('counter-cache.js', ['client', 'server']);
  api.export('CounterCache');
});

Package.onTest(function(api) {
  api.use(['tinytest', 'dburles:counter-cache', 'mongo', 'underscore']);
  api.add_files('counter-cache_tests.js', 'server');
});
