const {Router} = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const {validationResult} = require('express-validator');
const sgMail = require('@sendgrid/mail')
const User = require('../models/user');
const keys = require('../keys/index');
const regEmail = require('../emails/registration');
const resetEmail = require('../emails/reset');
const {registerValidators, loginValidators} = require('../utils/validators');
const router = Router();

sgMail.setApiKey(keys.SENDGRID_API_KEY);

router.get('/login', async (req, res) => {
    res.render('auth/login', {
        title: "Auth",
        isLogin: true,
        loginError: req.flash('loginError'),
        registerError: req.flash('registerError'),
    })
});

router.post('/login', loginValidators, async (req, res) => {
    try {
        const {email, password} = req.body;
        const candidate = await User.findOne({email});

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.flash('loginError', errors.array()[0].msg);
            return res.status(422).redirect('/auth/login#login');
        }

        if (candidate) {
            const areSame = await bcrypt.compare(password, candidate.password);

            if (areSame) {
                req.session.user = candidate;
                req.session.isAuthenticated = true;
                req.session.save((err) => {
                    if (err) throw new Error(err);
                    res.redirect('/');
                });
            } else {
                req.flash('loginError', 'Email or password is wrong.');
                res.redirect('/auth/login#login');
            }
        } else {
            req.flash('loginError', 'Email or password is wrong.');
            res.redirect('/auth/login#login');
        }
    } catch (err) {
        res.redirect('/auth/login#login');
        console.log(err);
    }
});

router.get('/logout', async (req, res) => {
    req.session.destroy(() => {
        res.redirect('/auth/login#login');
    });
});

router.post('/register', registerValidators, async (req, res) => {
    try {
        const {email, password, name} = req.body;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.flash('registerError', errors.array()[0].msg);
            return res.status(422).redirect('/auth/login#register');
        }

        const hashPassword = await bcrypt.hash(password, 10);
        const user = new User({
            email, name, password: hashPassword, cart: {items: []}
        });

        await user.save();

        req.session.user = user;
        req.session.isAuthenticated = true;
        req.session.save(async (err) => {
            if (err) throw new Error(err);
            res.redirect('/');
            sgMail.send(regEmail(email));
        });

    } catch (err) {
        console.log(err);
    }
});

router.get('/reset', (req, res) => {
    res.render('auth/reset', {
        title: 'Forgot password?',
        error: req.flash('error')
    })
});

router.post('/reset', (req, res) => {
    try {
        crypto.randomBytes(32, async (err, buffer) => {
            if (err) {
                req.flash('error', 'Something is wrong, try again later')
                return res.redirect('/auth/reset');
            }

            const token = buffer.toString('hex');
            const candidate = await User.findOne({email: req.body.email});

            if (candidate) {
                candidate.resetToken = token;
                candidate.resetTokenExp = Date.now() + (60 * 60 * 1000);
                await candidate.save();
                await sgMail.send(resetEmail(candidate.email, token)).then(() => {
                    console.log('letter send');
                })
                res.redirect('/auth/login#login');
            } else {
                req.flash('error', 'That email is not found');
                res.redirect('/auth/reset');
            }
        })
    } catch (err) {
        console.log(err);
    }
});

router.get('/password/:token', async (req, res) => {
    if (!req.params.token) {
        return res.redirect('/auth/login');
    }

    try {
        const user = await User.findOne({
            resetToken: req.params.token,
            resetTokenExp: {$gt: Date.now()}
        });

        if (!user) {
            return res.redirect('/auth/login');
        } else {
            res.render('auth/password', {
                title: 'Restore password',
                error: req.flash('passwordError'),
                userId: user._id.toString(),
                token: req.params.token
            })
        }
    } catch (err) {
        console.log(err);
    }
});

router.post('/password', async (req, res) => {
    try {
        const {password, confirm, token, userId} = req.body;

        if (password !== confirm) {
            req.flash('passwordError', 'Password mismatch');
            res.redirect(`/auth/password/${token}`);
        }

        const user = await User.findOne({
            _id: userId,
            resetToken: token,
            resetTokenExp: {$gt: Date.now()}
        });

        if (user) {
            user.password = await bcrypt.hash(req.body.password, 10);
            user.resetToken = null;
            user.resetTokenExp = null;
            await user.save();
            res.redirect('/auth/login');
        } else {
            req.flash('loginError', 'Token expired');
            res.redirect('/auth/login')
        }
    } catch (err) {

    }
});

module.exports = router;