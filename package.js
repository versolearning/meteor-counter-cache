Package.describe({
  summary: 'Cache the counts of an associated collection.'
});

Package.on_use(function(api) {
  api.use(['collection-hooks', 'underscore']);
  api.add_files('counter-cache.js', ['client', 'server']);
});

Package.on_test(function(api) {
  api.use(['tinytest', 'counter-cache']);
  api.add_files('counter-cache_tests.js', 'server');
});
