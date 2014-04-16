Tinytest.add('Counter cache - foreignKey works', function(test) {
  Authors = new Meteor.Collection('authors');
  Books = new Meteor.Collection('books');

  Authors.maintainCountOf(Books, 'authorId');

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
  Books.remove();
  Authors.remove();

  Publishers = new Meteor.Collection('publishers');
  Publishers.maintainCountOf(Books, function(doc) {
    return Authors.findOne(doc.authorId).publisherId;
  });

  var publisherId = Publishers.insert({
    name: 'Good Books'
  });
  var authorId = Authors.insert({
    name: 'Charles Darwin',
    publisherId: publisherId
  });
  var book1Id = Books.insert({
    name: 'On the Origin of Species',
    authorId: authorId
  });

  var publisher = Publishers.findOne(publisherId);

  test.equal(publisher.booksCount, 1);

  var book2Id = Books.insert({
    name: 'On the Origin of Species. Second Edition',
    authorId: authorId
  });

  publisher = Publishers.findOne(publisherId);

  test.equal(publisher.booksCount, 2);

  Books.remove(book2Id);

  publisher = Publishers.findOne(publisherId);

  test.equal(publisher.booksCount, 1);

  Books.remove(book1Id);

  publisher = Publishers.findOne(publisherId);

  test.equal(publisher.booksCount, 0);

  // Note:
  // If we remove an author, the publishers book count will not change to reflect this,
  // in this case a before-remove collection-hook on Authors should be setup to remove 
  // all books related to this author.
});