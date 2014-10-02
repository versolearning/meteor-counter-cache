Package.describe({
  summary: "Cache the counts of an associated collection",
  version: "0.2.1",
  git: "https://github.com/percolatestudio/meteor-counter-cache.git"
});

Package.onUse(function(api) {
  api.use([
    'mrt:collection-hooks@0.6.3',
    'underscore@1.0.0',
    'mongo@1.0.6'
  ]);
  api.add_files('counter-cache.js', ['client', 'server']);
});

Package.onTest(function(api) {
  api.use(['tinytest', 'dburles:counter-cache']);
  api.add_files('counter-cache_tests.js', 'server');
});
