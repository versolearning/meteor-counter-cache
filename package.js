Package.describe({
  summary: "Cache the counts of an associated collection",
  version: "1.0.0",
  git: "https://github.com/percolatestudio/meteor-counter-cache.git"
});

Package.onUse(function(api) {
  api.use(['underscore', 'mongo']);
  api.add_files('hooks.js');
  api.add_files('counter-cache.js');
});

Package.onTest(function(api) {
  api.use(['tinytest', 'counter-cache']);
  api.add_files('counter-cache_tests.js');
});
