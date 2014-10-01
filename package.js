Package.describe({
  summary: "Cache the counts of an associated collection",
  version: "0.2.0",
  git: "https://github.com/percolatestudio/meteor-counter-cache.git"
});

Package.onUse(function(api) {
  api.use([
    'matb33:collection-hooks@0.7.6',
    'underscore@1.0.0',
    'mongo@1.0.6'
  ]);
  api.add_files('counter-cache.js', ['client', 'server']);
});

Package.onTest(function(api) {
  api.use(['tinytest', 'dburles:counter-cache']);
  api.add_files('counter-cache_tests.js', 'server');
});
