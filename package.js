Package.describe({
  summary: "Cache the counts of an associated collection",
  version: "0.0.5",
  git: "https://github.com/hazio/meteor-counter-cache.git"
});

Package.onUse(function(api) {
  api.use([
    'matb33:collection-hooks@0.8.3',
    'underscore@1.0.9',
    'mongo@1.1.9_1'
  ]);
  api.add_files('counter-cache.js', ['client', 'server']);
});

Package.onTest(function(api) {
  api.use(['tinytest', 'underscore', 'mongo', 'matb33:collection-hooks@0.8.3']);
  api.add_files('counter-cache_tests.js', 'server');
  api.add_files('counter-cache.js', ['client', 'server']);
});
