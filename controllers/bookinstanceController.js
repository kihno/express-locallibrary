const async = require('async');
const { body, validationResult } = require('express-validator');
const { render } = require('pug');
const book = require('../models/book');

const Book = require('../models/book');
const BookInstance = require('../models/bookinstance');

exports.bookinstance_list = (req, res, next) => {
    BookInstance.find()
        .populate('book')
        .exec(function (err, list_bookinstances) {
            if (err) { return next(err)}
            res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances});
        });
};

exports.bookinstance_detail = (req, res, next) => {
    BookInstance.findById(req.params.id)
    .populate('book')
    .exec((err, bookinstance) => {
        if (err) { return next(err); }

        if (bookinstance == null) {
            const err = new Error('Book copy not found');
            err.status = 404;
            return next(err);
        }

        res.render('bookinstance_detail', { title: `Copy: ${bookinstance.book.title}`, bookinstance});
    });
};

exports.bookinstance_create_get = (req, res) => {
    Book.find({}, 'title').exec((err, books) => {
        if (err) { return next(err) }

        res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books,});
    });
};

exports.bookinstance_create_post = [
    body('book', 'Book must be specified')
    .trim()
    .isLength({ min:1 })
    .escape(),

    body('imprint', 'Imprint must be specified')
    .trim()
    .isLength({ min:1 })
    .escape(),

    body('status').escape(),

    body('due_back', 'Invalid date')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

    (req, res, next) => {
        const errors = validationResult(req);

        const bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
        });

        if (!errors.isEmpty()) {
            Book.find({}, 'title').exec(function (err, books) {
                if (err) { return next(err) }

                res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance});
            });
            return;
        }

        bookinstance.save((err) => {
            if (err) { return next(err) }

            res.redirect(bookinstance.url);
        });
    },
];

exports.bookinstance_delete_get = (req, res, next) => {
    BookInstance.findById(req.params.id)
    .exec((err, bookinstance) => {
        if (err) { return next(err); }

        if (bookinstance == null) {
            res.redirect('/catalog/books');
        }

        res.render('bookinstance_delete', { title: 'Delete Book Instance', bookinstance});
    });
};

exports.bookinstance_delete_post = (req, res, next) => {
    BookInstance.findByIdAndRemove(req.body.bookinstanceid, (err) => {
        if (err) { return next(err) }

        res.redirect('/catalog/bookinstances');
    });
};

exports.bookinstance_update_get = (req, res, next) => {
    async.parallel(
        {
            books(callback) {
                Book.find(callback)
            },
            bookinstance(callback) {
                BookInstance.findById(req.params.id)
                .populate('book')
                .exec(callback)
            }
        },
        (err, results) => {
            if (err) { return next(err) }

            if (results.bookinstance == null) {
                const err = new Error('Book instance not found.');
                err.status = 404;
                return next(err);
            }

            res.render('bookinstance_form', { title: 'Update Book Instance', book_list: results.books, selected_book: results.bookinstance.book._id, bookinstance: results.bookinstance});
        }
    );
};

exports.bookinstance_update_post = [
    body('book', 'Book instance must have a book name.')
    .trim()
    .isLength({ min:1 })
    .escape(),

    body('imprint', 'Book instance must have imprint information.')
    .isLength({ min:1 })
    .escape(),

    body('due_back')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

    body('status').escape(),

    (req, res, next) => {
        const errors = validationResult(req);

        const bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            due_back: req.body.due_back,
            status: req.body.status,
            _id: req.params.id,
        });

        if (!errors.isEmpty()) {
            Book.find({}, 'title')
            .exec((err, books) => {
                if (err) {return next(err) }
                res.render('bookinstance_form', { title: 'Update Book Instance', book_list: books, selected_book: bookinstance.book._id, bookinstance, errors: errors.array()});
            });
            return;
        } else {
            BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, (err, thebookinstance) => {
                if (err) { return next(err) }

                res.redirect(thebookinstance.url);
            });
        }
    }
];

