var debug = function(str) {
  // console.log('counter-cache: ' + str);
};

// iterator for the property functions below
var walker = function(node, part) { return node[part]; };

_.mixin({
  dottedProperty: function(record, key) {
    return _.reduce(key.split('.'), walker, record || {});
  }
});

var resolveForeignKey = function(doc, foreignKey) {
  return _.isFunction(foreignKey) ? foreignKey(doc) : _.dottedProperty(doc, foreignKey);
};

Meteor.Collection.prototype.maintainCountOf = function(collection, foreignKey, counterField) {
  var self = this;

  // what is Meteor.users an instanceof ?
  // if (! (collection instanceof Meteor.Collection))
  //   throw new Error("Expected first parameter to be a Meteor Collection");
  if (typeof collection === 'undefined')
    throw new Error("Missing parameter: collection");
  if (typeof foreignKey === 'undefined')
    throw new Error("Missing parameter: foreignKey");

  if (typeof counterField === 'undefined')
    counterField = collection._name + 'Count';

  debug('setup counts of `' + collection._name + '` onto `' + this._name + '` with counter field `' + counterField + '`');

  var modifier = { $inc: {}};
  var increment = function(_id) {
    debug('increment ' + _id);
    if (! _id) return;

    modifier.$inc[counterField] = 1;
    self.update(_id, modifier);
  };
  var decrement = function(_id) {
    debug('decrement ' + _id);
    if (! _id) return;

    modifier.$inc[counterField] = -1;
    self.update(_id, modifier);
  };

  collection.after.insert(function(userId, doc) {
    var foreignKeyValue = resolveForeignKey(doc, foreignKey);
    if (foreignKeyValue)
      increment(foreignKeyValue);
  });

  collection.after.update(function(userId, doc, fieldNames, modifier, options) {
    var self = this;
    var oldDoc = self.previous;

    // console.log(modifier);
    // console.log(fieldNames);
    // console.log(self.previous);
    // console.log(doc);

    // LocalCollection._modify(doc, modifier);

    var oldDocForeignKeyValue = resolveForeignKey(oldDoc, foreignKey);
    var newDocForeignKeyValue = resolveForeignKey(doc, foreignKey);

    if (oldDocForeignKeyValue && newDocForeignKeyValue !== oldDocForeignKeyValue) {
      decrement(oldDocForeignKeyValue);
      if (newDocForeignKeyValue)
        increment(newDocForeignKeyValue);
    }

    if (! oldDocForeignKeyValue && newDocForeignKeyValue)
      increment(newDocForeignKeyValue);
  });

  collection.after.remove(function(userId, doc) {
    var foreignKeyValue = resolveForeignKey(doc, foreignKey);
    if (foreignKeyValue)
      decrement(foreignKeyValue);
  });
};
