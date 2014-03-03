Tinytest.add('Counter cache - works', function(test) {
  Authors = new Meteor.Collection('authors');
  Books = new Meteor.Collection('books');
  var author;

  Authors.maintainCountOf(Books, 'authorId');

  authorId = Authors.insert({
    name: 'Charles Darwin'
  });
  var bookId = Books.insert({
    name: 'On the Origin of Species',
    authorId: authorId
  });

  author = Authors.findOne(authorId);
  
  // insert
  test.equal(author.booksCount, 1);
  
  Books.remove(bookId);
  author = Authors.findOne(authorId);
  // remove
  test.equal(author.booksCount, 0);
  
  // insert book again
  var bookId = Books.insert({
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
  
  author2 = Authors.findOne(author2Id);
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
