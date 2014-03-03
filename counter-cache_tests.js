Tinytest.add('Counter cache - works', function(test) {
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
  var author = Authors.findOne(authorId);
  // remove
  test.equal(author.booksCount, 0);
  
  // insert book again
  var bookId = Books.insert({
    name: 'On the Origin of Species',
    authorId: authorId
  });
  var author = Authors.findOne(authorId);
  
  // we should be 1 again
  test.equal(author.booksCount, 1);
  
  var author2Id = Authors.insert({
    name: 'Charles Darwin 2'
  });
  
  // change this book to another author
  Books.update(bookId, { $set: { authorId: author2Id }});
  
  var author = Authors.findOne(authorId);
  // book changed author
  test.equal(author.booksCount, 0);
  
  var author2 = Authors.findOne(author2Id);
  test.equal(author2.booksCount, 1);
  
  // set back to original author again
  Books.update(bookId, { $set: { authorId: authorId }});
  
  var author2 = Authors.findOne(author2Id);
  test.equal(author2.booksCount, 0);
  
  var author = Authors.findOne(authorId);
  test.equal(author.booksCount, 1);
  
  Books.update(bookId, { $unset: { authorId: '' }});
  
  var author = Authors.findOne(authorId);
  test.equal(author.booksCount, 0);

  Books.update(bookId, { $set: { nothing: true }});
  test.equal(author.booksCount, 0);
});
