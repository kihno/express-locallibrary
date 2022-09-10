const async = require('async');
const { body, validationResult } = require('express-validator');

const Book = require('../models/book');
const Author = require('../models/author');
const Genre = require('../models/genre');
const BookInstance = require('../models/bookinstance')

exports.index = (req, res) => {
    async.parallel({
        book_count(callback) {
            Book.countDocuments({}, callback);
        },
        book_instance_count(callback) {
            BookInstance.countDocuments({}, callback);
        },
        book_instance_available_count(callback) {
            BookInstance.countDocuments({ status: 'Available' }, callback);
        },
        author_count(callback) {
            Author.countDocuments({}, callback);
        },
        genre_count(callback) {
            Genre.countDocuments({}, callback);
        }
    },
    (err, results) => {
        res.render('index', { title: 'Local Library Home', error: err, data: results});
    });
};

exports.book_list = (req, res, next) => {
    Book.find({}, 'title author')
        .sort({title:1})
        .populate('author')
        .exec(function (err, list_books) {
            if (err) { return next(err); }
            res.render('book_list', { title: 'Book List', book_list: list_books});
        });
};

exports.book_detail = (req, res, next) => {
    async.parallel(
        {
            book(callback) {
                Book.findById(req.params.id)
                .populate('author')
                .populate('genre')
                .exec(callback)
            },
            book_instance(callback) {
                BookInstance.find({ book: req.params.id }).exec(callback);
            },
        },
        (err, results) => {
            if (err) {
                return next(err);
            }

            if (results == null) {
                const err = new Error('Book not found');
                err.status = 404;
                return next(err);
            }

            res.render('book_detail', { title: results.book.title, book: results.book, book_instances: results.book_instance});
        }
    );
};

exports.book_create_get = (req, res, next) => {
    async.parallel(
        {
            authors(callback) {
                Author.find(callback);
            },
            genres(callback) {
                Genre.find(callback);
            },
        },
        (err, results) => {
            if (err) { return next(err); }

            res.render('book_form', { title: 'Create Book', authors: results.authors, genres: results.genres });
        }
    );
};

exports.book_create_post = [
    //Convert genre to array
    (req, res, next) => {
        if (!Array.isArray(req.body.genre)) {
            req.body.genre = typeof req.body.genre === 'undefined' ? [] : [req.body.genre];
        }
        next();
    },

    //Validate and sanitize
    body('title', 'Title must not be empty.')
    .trim()
    .isLength({ min:1 })
    .escape(),

    body('author', 'Author must not be empty.')
    .trim()
    .isLength({ min:1 })
    .escape(),

    body('summary', 'Summary must not be empty.')
    .trim()
    .isLength({ min: 1})
    .escape(),

    body('isbn', "ISBN mus tnot be empty")
    .trim()
    .isLength({ min:1 })
    .escape(),

    body('genre.*', ).escape(),

    //Process request after validation
    (req, res, next) => {
        //Extract errors
        const errors = validationResult(req);

        //Create book object
        const book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre,
        });

        if (!errors.isEmpty()) {
            //Handle errors
            async.parallel(
                {
                    authors(callback) {
                        Author.find(callback);
                    },
                    genres(callback) {
                        Genre.find(callback);
                    },
                },
                (err, results) => {
                    if (err) { return next(err) }

                    //Mark selected genres as checked
                    for (const genre of results.genre) {
                        if (book.genre.includes(genre._id)) {
                            genre.checked = 'true';
                        }
                    }

                    res.render('book_form', { title: 'Create Book', authors: results.authors, genres: results.genres, book, errors: errors.array(),});
                }
            );
            return;
        }

        //Data valid, save book
        book.save((err) => {
            if (err) { return next(err) }

            res.redirect(book.url);
        });
    },
];

exports.book_delete_get = (req, res) => {
    res.send('NOT IMPLMENTED: book delete GET');
};

exports.book_delete_post = (req, res) => {
    res.send('NOT IMPLEMENTED: book delete POST');
};

exports.book_update_get = (req, res) => {
    res.send('NOT IMPLEMENTED: book update GET');
};

exports.book_update_post = (req, res) => {
    res.send('NOT IMPLEMENTED: book update POST');
};