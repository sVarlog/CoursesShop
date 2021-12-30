const {Router} = require('express');
const auth = require('../middleware/auth');
const User = require('../models/user');
const {validationResult} = require('express-validator');
const {profileValidators} = require('../utils/validators');
const router = Router();

router.get('/', auth, async (req, res) => {
    console.log(req.flash('nameErorr'));
    res.render('profile', {
        title: "Profile",
        isProfile: true,
        nameError: req.flash('nameError'),
        usernameError: req.flash('usernameError'),
        user: req.user.toObject()
    });
});

router.post('/', auth, profileValidators, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            for (let index in errors.array()) {
                req.flash(`${errors.array()[index].param}Error`, errors.array()[index].msg);
            }
            return res.status(422).redirect('/profile');
        }

        const user = await User.findById(req.user._id);

        const toChange = {
            name: req.body.name,
            username: req.body.username
        }

        if (req.files.avatar) {
            toChange.avatarUrl = req.files.avatar[0].path;
        }

        Object.assign(user, toChange);
        await user.save();
        res.redirect('/profile');
    } catch (err) {
        console.log(err);
    }
});

module.exports = router;