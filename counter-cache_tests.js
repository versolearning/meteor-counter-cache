Tinytest.add('Counter cache - foreignKey works', function(test) {
  Authors = new Mongo.Collection('authors' + test.id);
  Books = new Mongo.Collection('books' + test.id);

  Authors.maintainCountOf(Books, 'authorId', 'booksCount');

  var authorId = Authors.insert({
    name: 'Charles Darwin'
  });
  var bookId = Books.insert({
    name: 'On the Origin of Species',
    authorId: authorId
  });

  var author = Authors.findOne(authorId);
  
  // insert
  test.equal(author.booksCount, 1);
  
  Books.remove(bookId);
  author = Authors.findOne(authorId);
  // remove
  test.equal(author.booksCount, 0);
  
  // insert book again
  bookId = Books.insert({
    name: 'On the Origin of Species',
    authorId: authorId
  });
  author = Authors.findOne(authorId);
  
  // we should be 1 again
  test.equal(author.booksCount, 1);
  
  author2Id = Authors.insert({
    name: 'Charles Darwin 2'
  });

  // insert a book for a different author
  book2Id = Books.insert({
    name: 'A test book',
    authorId: author2Id
  });

  // this should not affect the first author count
  author = Authors.findOne(authorId);
  test.equal(author.booksCount, 1);

  Books.remove(book2Id);
  
  // change this book to another author
  Books.update(bookId, { $set: { authorId: author2Id }});
  
  author = Authors.findOne(authorId);
  // book changed author
  test.equal(author.booksCount, 0);

  var author2 = Authors.findOne(author2Id);
  test.equal(author2.booksCount, 1);
  
  // set back to original author again
  Books.update(bookId, { $set: { authorId: authorId }});
  
  author2 = Authors.findOne(author2Id);
  test.equal(author2.booksCount, 0);
  
  author = Authors.findOne(authorId);
  test.equal(author.booksCount, 1);
  
  // remove authorId
  Books.update(bookId, { $unset: { authorId: '' }});
  
  author = Authors.findOne(authorId);
  test.equal(author.booksCount, 0);

  // random update that doesn't include the authorId
  Books.update(bookId, { $set: { nothing: true }});
  test.equal(author.booksCount, 0);

  // update with the same id
  Books.update(bookId, { $set: { authorId: authorId }});
  Books.update(bookId, { $set: { authorId: authorId }});
  Books.update(bookId, { $set: { authorId: authorId }});

  author = Authors.findOne(authorId);

  test.equal(author.booksCount, 1);
});

Tinytest.add('Counter cache - foreignKey lookup function', function(test) {
  Publishers = new Mongo.Collection('publishers' + test.id);
  Publishers.maintainCountOf(Books, function(doc) {
    return Authors.findOne(doc.authorId).publisherId;
  }, 'booksCount');

  var publisherId = Publishers.insert({
    name: 'Good Books'
  });
  var publisher2Id = Publishers.insert({
    name: 'Gooder Books'
  });
  var authorId = Authors.insert({
    name: 'Charles Darwin',
    publisherId: publisherId
  });
  var author2Id = Authors.insert({
    name: 'Charles Darwin 2',
    publisherId: publisher2Id
  });
  var bookId = Books.insert({
    name: 'On the Origin of Species',
    authorId: authorId
  });

  var publisher = Publishers.findOne(publisherId);

  // insert
  test.equal(publisher.booksCount, 1);

  // remove
  Books.remove(bookId);

  publisher = Publishers.findOne(publisherId);

  test.equal(publisher.booksCount, 0);


  // TODO: Add tests like above
 

  // Note:
  // If we remove an author, the publishers book count will not change to reflect this,
  // in this case a before-remove collection-hook on Authors should be setup to remove 
  // all books related to this author.
});

Tinytest.add('Counter cache - filter and foreignKey - add and remove', function(test) {
  Authors = new Mongo.Collection('authors' + test.id);
  Books = new Mongo.Collection('books' + test.id);
  var filter = function(doc) { return doc.isFiction; };
  Authors.maintainCountOf(Books, 'authorId', 'fictionBooksCount', filter);

  var authorId = Authors.insert({
    name: 'Test Author'
  });
  
  // Filter increments on insert
  var book1Id = Books.insert({
    name: 'How to test your book counters',
    authorId: authorId,
    isFiction: true
  });
  test.equal(Authors.findOne(authorId).fictionBooksCount, 1);

  // Filter shouldn't have incremented with this book
  var book2Id = Books.insert({
    name: 'How to test your book counters again',
    authorId: authorId,
    isFiction: false
  });
  test.equal(Authors.findOne(authorId).fictionBooksCount, 1);

  // filter decrements on delete
  Books.remove(book1Id);
  test.equal(Authors.findOne(authorId).fictionBooksCount, 0);

  // but not if it's false
  Books.remove(book2Id);
  test.equal(Authors.findOne(authorId).fictionBooksCount, 0);
});

Tinytest.add('Counter cache - filter and foreignKey - changes', function(test) {
  Authors = new Mongo.Collection('authors' + test.id);
  Books = new Mongo.Collection('books' + test.id);
  var filter = function(doc) { return doc.isFiction; };
  Authors.maintainCountOf(Books, 'authorId', 'fictionBooksCount', filter);

  var author1Id = Authors.insert({
    name: 'Test Author',
    fictionBooksCount: 0
  });
  var author2Id = Authors.insert({
    name: 'Test Author 2',
    fictionBooksCount: 0
  });
  var bookId = Books.insert({
    name: 'How to test your book counters',
    authorId: author1Id,
    isFiction: true
  });
  test.equal(Authors.findOne(author1Id).fictionBooksCount, 1);
  
  // 1. an irrelevant change
  Books.update(bookId, {$set: {name: 'A new way to test'}});
  test.equal(Authors.findOne(author1Id).fictionBooksCount, 1);
  test.equal(Authors.findOne(author2Id).fictionBooksCount, 0);
  
  // 2. change it to no longer match
  Books.update(bookId, {$set: {isFiction: false}});
  test.equal(Authors.findOne(author1Id).fictionBooksCount, 0);
  test.equal(Authors.findOne(author2Id).fictionBooksCount, 0);
  
  // 3. an irrelevant change
  Books.update(bookId, {$set: {name: 'A new way to test again'}});
  test.equal(Authors.findOne(author1Id).fictionBooksCount, 0);
  test.equal(Authors.findOne(author2Id).fictionBooksCount, 0);
  
  // 4. change author without changing matching
  Books.update(bookId, {$set: {authorId: author2Id}});
  test.equal(Authors.findOne(author1Id).fictionBooksCount, 0);
  test.equal(Authors.findOne(author2Id).fictionBooksCount, 0);
  
  // 5. change to now match
  Books.update(bookId, {$set: {isFiction: true}});
  test.equal(Authors.findOne(author1Id).fictionBooksCount, 0);
  test.equal(Authors.findOne(author2Id).fictionBooksCount, 1);
  
  // 6. change author without changing matching
  Books.update(bookId, {$set: {authorId: author1Id}});
  test.equal(Authors.findOne(author1Id).fictionBooksCount, 1);
  test.equal(Authors.findOne(author2Id).fictionBooksCount, 0);

  // 7. change author while changing matching
  Books.update(bookId, {$set: {authorId: author2Id, isFiction: false}});
  test.equal(Authors.findOne(author1Id).fictionBooksCount, 0);
  test.equal(Authors.findOne(author2Id).fictionBooksCount, 0);
  
  // 8. change author while changing matching
  Books.update(bookId, {$set: {authorId: author1Id, isFiction: true}});
  test.equal(Authors.findOne(author1Id).fictionBooksCount, 1);
  test.equal(Authors.findOne(author2Id).fictionBooksCount, 0);
});