const Genre = require('../models/genre');
const Book = require('../models/book');
const async = require('async');

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
    res.send('NOT IMPLEMENTED: genre create GET');
};

exports.genre_create_post = (req, res) => {
    res.send('NOT IMPLEMENTED: genre create POST');
};

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