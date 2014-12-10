var setup = function(test, options) {
  var collections = {
    authors: new Mongo.Collection('authors' + test.id),
    books: new Mongo.Collection('books' + test.id)
  }
  
  options = options || {target: {}, source: {}};
  _.defaults(options.target, {
    collection: collections.authors,
    counter: 'booksCount'
  });
  _.defaults(options.source, {
    collection: collections.books,
    foreignKey: 'authorId'
  });
  var bookCounter = new CounterCache(options);
  
  collections.books.mutate = {
    insert: function(doc) {
      bookCounter.insert(doc);
      return collections.books.insert(doc);
    },
    update: function(id, update) {
      bookCounter.update(id, update);
      return collections.books.update(id, update);
    },
    remove: function(id) {
      bookCounter.remove(id);
      return collections.books.remove(id)
    }
  };
  
  return collections;
}


Tinytest.add('Counter cache - foreignKey works', function(test) {
  var collections = setup(test);
  
  var authorId = collections.authors.insert({
    name: 'Charles Darwin'
  });
  var bookId = collections.books.mutate.insert({
    name: 'On the Origin of Species',
    authorId: authorId
  });

  var author = collections.authors.findOne(authorId);
  
  // insert
  test.equal(author.booksCount, 1);
  
  collections.books.mutate.remove(bookId);
  author = collections.authors.findOne(authorId);
  // remove
  test.equal(author.booksCount, 0);
  
  // insert book again
  bookId = collections.books.mutate.insert({
    name: 'On the Origin of Species',
    authorId: authorId
  });
  author = collections.authors.findOne(authorId);
  
  // we should be 1 again
  test.equal(author.booksCount, 1);
  
  author2Id = collections.authors.insert({
    name: 'Charles Darwin 2'
  });

  // insert a book for a different author
  book2Id = collections.books.mutate.insert({
    name: 'A test book',
    authorId: author2Id
  });

  // this should not affect the first author count
  author = collections.authors.findOne(authorId);
  test.equal(author.booksCount, 1);

  collections.books.mutate.remove(book2Id);
  
  // change this book to another author
  collections.books.mutate.update(bookId, { $set: { authorId: author2Id }});
  
  author = collections.authors.findOne(authorId);
  // book changed author
  test.equal(author.booksCount, 0);

  var author2 = collections.authors.findOne(author2Id);
  test.equal(author2.booksCount, 1);
  
  // set back to original author again
  collections.books.mutate.update(bookId, { $set: { authorId: authorId }});
  
  author2 = collections.authors.findOne(author2Id);
  test.equal(author2.booksCount, 0);
  
  author = collections.authors.findOne(authorId);
  test.equal(author.booksCount, 1);
  
  // remove authorId
  collections.books.mutate.update(bookId, { $unset: { authorId: '' }});
  
  author = collections.authors.findOne(authorId);
  test.equal(author.booksCount, 0);

  // random update that doesn't include the authorId
  collections.books.mutate.update(bookId, { $set: { nothing: true }});
  test.equal(author.booksCount, 0);

  // update with the same id
  collections.books.mutate.update(bookId, { $set: { authorId: authorId }});
  collections.books.mutate.update(bookId, { $set: { authorId: authorId }});
  collections.books.mutate.update(bookId, { $set: { authorId: authorId }});

  author = collections.authors.findOne(authorId);

  test.equal(author.booksCount, 1);
});

Tinytest.add('Counter cache - foreignKey lookup function', function(test) {
  // this one's a bit different
  var collections = {
    publishers: new Mongo.Collection('publishers' + test.id),
    authors: new Mongo.Collection('authors' + test.id),
    books: new Mongo.Collection('books' + test.id)
  }
  
  var bookCounter = new CounterCache({
    target: {
      collection: collections.publishers,
      counter: 'fictionBooksCount'
    },
    source: {
      collection: collections.books,
      foreignKey: function(doc) {
        return collections.authors.findOne(doc.authorId).publisherId;
      },
      filter: function(doc) { return doc.isFiction; }
    }
  });
  
  collections.books.mutate = {
    insert: function(doc) {
      bookCounter.insert(doc);
      return collections.books.insert(doc);
    },
    update: function(id, update) {
      bookCounter.update(id, update);
      return collections.books.update(id, update);
    },
    remove: function(id) {
      bookCounter.remove(id);
      return collections.books.remove(id)
    }
  };

  var publisherId = collections.publishers.insert({
    name: 'Good collections.books'
  });
  var publisher2Id = collections.publishers.insert({
    name: 'Gooder collections.books'
  });
  var authorId = collections.authors.insert({
    name: 'Charles Darwin',
    publisherId: publisherId
  });
  var author2Id = collections.authors.insert({
    name: 'Charles Darwin 2',
    publisherId: publisher2Id
  });
  var bookId = collections.books.mutate.insert({
    name: 'On the Origin of Species',
    authorId: authorId,
    isFiction: true
  });

  var publisher = collections.publishers.findOne(publisherId);

  // insert
  test.equal(publisher.fictionBooksCount, 1);

  // remove
  collections.books.mutate.remove(bookId);

  publisher = collections.publishers.findOne(publisherId);

  test.equal(publisher.fictionBooksCount, 0);


  // TODO: Add tests like above
 

  // Note:
  // If we remove an author, the publishers book count will not change to reflect this,
  // in this case a before-remove collection-hook on collections.authors should be setup to remove 
  // all collections.books related to this author.
});

Tinytest.add('Counter cache - filter and foreignKey - add and remove', function(test) {
  var collections = setup(test, {
    target: {
      counter: 'fictionBooksCount'
    },
    source: {
      filter: function(doc) { return doc.isFiction; }
    }
  });
  
  var authorId = collections.authors.insert({
    name: 'Test Author'
  });
  
  // Filter increments on insert
  var book1Id = collections.books.mutate.insert({
    name: 'How to test your book counters',
    authorId: authorId,
    isFiction: true
  });
  test.equal(collections.authors.findOne(authorId).fictionBooksCount, 1);

  // Filter shouldn't have incremented with this book
  var book2Id = collections.books.mutate.insert({
    name: 'How to test your book counters again',
    authorId: authorId,
    isFiction: false
  });
  test.equal(collections.authors.findOne(authorId).fictionBooksCount, 1);

  // filter decrements on delete
  collections.books.mutate.remove(book1Id);
  test.equal(collections.authors.findOne(authorId).fictionBooksCount, 0);

  // but not if it's false
  collections.books.mutate.remove(book2Id);
  test.equal(collections.authors.findOne(authorId).fictionBooksCount, 0);
});

Tinytest.add('Counter cache - filter and foreignKey - changes', function(test) {
  var collections = setup(test, {
    target: {
      counter: 'fictionBooksCount'
    },
    source: {
      filter: function(doc) { return doc.isFiction; }
    }
  });

  var author1Id = collections.authors.insert({
    name: 'Test Author',
    fictionBooksCount: 0
  });
  var author2Id = collections.authors.insert({
    name: 'Test Author 2',
    fictionBooksCount: 0
  });
  var bookId = collections.books.mutate.insert({
    name: 'How to test your book counters',
    authorId: author1Id,
    isFiction: true
  });
  test.equal(collections.authors.findOne(author1Id).fictionBooksCount, 1);
  
  // 1. an irrelevant change
  collections.books.mutate.update(bookId, {$set: {name: 'A new way to test'}});
  test.equal(collections.authors.findOne(author1Id).fictionBooksCount, 1);
  test.equal(collections.authors.findOne(author2Id).fictionBooksCount, 0);
  
  // 2. change it to no longer match
  collections.books.mutate.update(bookId, {$set: {isFiction: false}});
  test.equal(collections.authors.findOne(author1Id).fictionBooksCount, 0);
  test.equal(collections.authors.findOne(author2Id).fictionBooksCount, 0);
  
  // 3. an irrelevant change
  collections.books.mutate.update(bookId, {$set: {name: 'A new way to test again'}});
  test.equal(collections.authors.findOne(author1Id).fictionBooksCount, 0);
  test.equal(collections.authors.findOne(author2Id).fictionBooksCount, 0);
  
  // 4. change author without changing matching
  collections.books.mutate.update(bookId, {$set: {authorId: author2Id}});
  test.equal(collections.authors.findOne(author1Id).fictionBooksCount, 0);
  test.equal(collections.authors.findOne(author2Id).fictionBooksCount, 0);
  
  // 5. change to now match
  collections.books.mutate.update(bookId, {$set: {isFiction: true}});
  test.equal(collections.authors.findOne(author1Id).fictionBooksCount, 0);
  test.equal(collections.authors.findOne(author2Id).fictionBooksCount, 1);
  
  // 6. change author without changing matching
  collections.books.mutate.update(bookId, {$set: {authorId: author1Id}});
  test.equal(collections.authors.findOne(author1Id).fictionBooksCount, 1);
  test.equal(collections.authors.findOne(author2Id).fictionBooksCount, 0);

  // 7. change author while changing matching
  collections.books.mutate.update(bookId, {$set: {authorId: author2Id, isFiction: false}});
  test.equal(collections.authors.findOne(author1Id).fictionBooksCount, 0);
  test.equal(collections.authors.findOne(author2Id).fictionBooksCount, 0);
  
  // 8. change author while changing matching
  collections.books.mutate.update(bookId, {$set: {authorId: author1Id, isFiction: true}});
  test.equal(collections.authors.findOne(author1Id).fictionBooksCount, 1);
  test.equal(collections.authors.findOne(author2Id).fictionBooksCount, 0);
});