meteor-counter-cache
====================

Cache the counts of an associated collection.
Forked from https://github.com/percolatestudio/meteor-counter-cache/ to work with Meteor version 0.9 and above.

## Usage

All definitions should be made *server side only*.

## Examples

```javascript
// Sets up a 'booksCount' field on each author
Authors.maintainCountOf(Books, 'authorId');

// TODO: more examples
```

## API

**collection1.maintainCountOf(collection2, lookup, [name])**

1. ***collection1***

  The collection to store the counter on
  
2. ***Arguments***

  **collection2** — Meteor Collection  
  The collection to maintain a count of

  **lookup** — String or Function  
  The field name on collection2 to perform the match against collection1 `_id`  
  or a callback function returning a value to match against collection1 `_id`

  **name** — String  
  Optional. Specify a custom counter field name


## License 

MIT. (c) Percolate Studio

counter-cache was developed as part of the [Verso](http://versoapp.com) project.
