Tinytest.add('Counter cache - foreignKey works', function(test) {
  Authors = new Meteor.Collection('authors' + test.id);
  Books = new Meteor.Collection('books' + test.id);

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
  Publishers = new Meteor.Collection('publishers' + test.id);
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

Tinytest.add('Counter cache - filter and foreignKey work together', function(test) {
  Publishers = new Meteor.Collection('publishers' + test.id);
  Authors = new Meteor.Collection('authors' + test.id);
  Books = new Meteor.Collection('books' + test.id);

  var filter = function(doc) {
    return doc.isFiction;
  };

  Authors.maintainCountOf(Books, 'authorId', 'fictionBooksCount', filter);

  var authorId = Authors.insert({
    name: 'Test Author'
  });
  var book1Id = Books.insert({
    name: 'How to test your book counters',
    authorId: authorId,
    isFiction: true
  });

  var author = Authors.findOne(authorId);

  // Filter increments on insert
  test.equal(author.fictionBooksCount, 1);

  var book2Id = Books.insert({
    name: 'How to test your book counters again',
    authorId: authorId,
    isFiction: false
  });

  author = Authors.findOne(authorId);

  // Filter shouldn't have incremented with this book
  test.equal(author.fictionBooksCount, 1);

  // do a remove test on both cases


  // update tests

  // 1. updating but not changing both a matching and non matching filter
  // 2. updating from matching to non-matching without changing author
  // 3. 

});