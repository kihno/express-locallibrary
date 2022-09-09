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
    res.send('NOT IMPLMENTED: genre delete GET');
};

exports.genre_delete_post = (req, res) => {
    res.send('NOT IMPLEMENTED: genre delete POST');
};

exports.genre_update_get = (req, res) => {
    res.send('NOT IMPLEMENTED: genre update GET');
};

exports.genre_update_post = (req, res) => {
    res.send('NOT IMPLEMENTED: genre update POST');
};