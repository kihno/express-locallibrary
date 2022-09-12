const async = require('async');
const { body, validationResult } = require('express-validator');

const Genre = require('../models/genre');
const Book = require('../models/book');

exports.genre_list = (req, res, next) => {
    Genre.find()
    .sort({ name:1 })
    .exec(function(err, list_genre) {
        if (err) { return next(err); }
        res.render('genre_list', { title: 'Genre List', genre_list: list_genre});
    });
};

exports.genre_detail = (req, res, next) => {
    async.parallel(
        {
            genre(callback) {
                Genre.findById(req.params.id).exec(callback);
            },
            genre_books(callback) {
                Book.find({ genre: req.params.id }).exec(callback);
            },
        },
        (err, results) => {
            if (err) {
                return next(err)
            }
            
            if (results.genre == null) {
                const err = new Error('Genre not found');
                err.stats = 404;
                return next(err);
            }

            res.render('genre_detail', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books, });
        }
    );
};

exports.genre_create_get = (req, res) => {
    res.render('genre_form', {title: 'Create Genre'});
};

exports.genre_create_post = [
    //Validate and sanitize the name field
    body('name', 'Genre name required').trim().isLength({min:1}).escape(),

    //Process request after validation
    (req, res, next) => {
        //Extract validation erros from request
        const errors = validationResult(req);

        //Create genre object with escaped and trimmed data
        const genre = new Genre({ name: req.body.name });

        if (!errors.isEmpty()) {
            //If errors, render form again with sanitized values/error message
            res.render('genre_form', { title: 'Create Genre', genre, errors: errors.array(),});
            return;
        } else {
            //Form is valid, check if Genre already exists
            Genre.findOne({ name: req.body.name }).exec((err, found_genre) => {
                if (err) {
                    return next(err);
                }

                if (found_genre) {
                    //Genre exists, redirect to details page
                    res.redirect(found_genre.url);
                } else {
                    genre.save((err) => {
                        if (err) {
                            return next(err);
                        }
                        //Genre saved, redirect to details page
                        res.redirect(genre.url);
                    });
                }
            });
        }
    },
];

exports.genre_delete_get = (req, res) => {
    async.parallel(
        {
            genre(callback) {
                Genre.findById(req.params.id).exec(callback);
            },
            genres_books(callback) {
                Book.find({ genre: req.params.id }).exec(callback);
            },
        },
        (err, results) => {
            if (err) { return next(err) }

            if (results.genre == null) {
                res.redirect('catalog/genres');
            }

            res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genres_books});
        }
    );
};

exports.genre_delete_post = (req, res) => {
    async.parallel(
        {
            genre(callback) {
                Genre.findById(req.body.genreid).exec(callback);
            },
            genres_books(callback) {
                Book.find({ genre: req.body.genreid }).exec(callback);
            },
        },
        (err, results) => {
            if (err) { return next(err) }

            if (results.genres_books.length > 0) {
                res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genres_books,});
                return;
            }

            Genre.findByIdAndRemove(req.body.genreid, (err) => {
                if (err) { return next(err) }

                res.redirect('/catalog/genres');
            });
        }
    );
};

exports.genre_update_get = (req, res, next) => {
    Genre.findById(req.params.id, (err, genre) => {
        if (err) { return next(err) }

        if (genre === null) {
            const err = new Error('Genre not found.');
            err.status = 404;
            return next(err);
        }

        res.render('genre_form', { title: 'Update Genre', genre});
    });
};

exports.genre_update_post = [
    body('name', 'Genre name must contain at least 3 characters.')
    .trim()
    .isLength({ min:3 })
    .escape(),

    (req, res, next) => {
        const errors = validationResult(req);

        const genre = new Genre(
            {
                name: req.body.name,
                _id: req.params.id,
            }
        );

        if (!errors.isEmpty()) {
            res.render('author_form', { title: 'Update Genre', genre, errors: errors.array()});
            return;
        } else {
            Genre.findByIdAndUpdate(req.params.id, genre, {}, (err, thegenre) => {
                if (err) { return next(err) }

                res.redirect(thegenre.url);
            });
        }
    },
];