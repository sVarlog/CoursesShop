const {body} = require('express-validator');
const User = require('../models/user');

exports.registerValidators = [
    body('email', 'Enter correct email.')
        .isEmail()
        .custom(async (value, {req}) => {
            try {
                const user = await User.findOne({email: value});
                if (user) return Promise.reject('User with this email is now exists.');
            } catch (err) {
                console.log(err);
            }
        })
        .normalizeEmail({gmail_remove_dots: false}),
    body('name', 'Name must be at least 2 characters.')
        .isLength({min: 2})
        .trim(),
    body('password', 'Password must be at least 4 characters.')
        .isLength({min: 4, max: 56})
        .isAlphanumeric()
        .trim(),
    body('confirm')
        .custom((value, {req}) => {
            if (value !== req.body.password) throw new Error('Passwords must match.');
            return true;
        })
        .trim(),
];

exports.loginValidators = [
    body('email', 'Enter correct email')
        .isEmail()
        .normalizeEmail({gmail_remove_dots: true}),
    body('password', 'Password must be at least 4 characters.')
        .isLength({min: 4, max: 56})
        .isAlphanumeric()
        .trim(),
];

exports.courseValidators = [
    body('title', 'Course name must be at least 3 characters')
        .isLength({min: 3})
        .trim(),
    body('price', 'Enter correct price')
        .isNumeric(),        
];

exports.profileValidators = [
    body('name', 'Name cannot be empty')
        .isLength({min: 1}),
    body('username', 'Username cannot be empty')
        .isLength({min: 1})
];