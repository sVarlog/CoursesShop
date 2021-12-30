const {Router} = require('express');
const {validationResult} = require('express-validator');
const Course = require('../models/course');
const auth = require('../middleware/auth');
const {courseValidators} = require('../utils/validators');
const router = Router();

function isOwner(course, req) {
    return course.userId.toString() === req.user._id.toString();
}

router.get('/', async (req, res) => {
    try {
        const courses = await Course.find().populate('userId', 'email name').select('price title img');
        res.render('courses', {
            title: 'Courses',
            isCourses: true,
            userId: req.user ? req.user._id.toString() : null,
            courses
        });
    } catch (err) {
        console.log(err);
    }
});

router.get('/:id/edit', auth, async (req, res) => {
    if (!req.query.allow) return res.redirect('/');

    try {
        const course = await Course.findById(req.params.id);
        if (!isOwner(course, req)) return res.redirect('/courses');

        res.render('course-edit', {
            title: `Edit ${course.title}`,
            course
        })
    } catch (err) {
        console.log(err);
    }
});

router.post('/edit', auth, courseValidators, async (req, res) => {
    try {
        const errors = validationResult(req);
        const {id, title, price, description, userId} = req.body;

        if (!errors.isEmpty()) {
            return res.status(422).redirect(`/courses/${id}/edit?allow=true`);
        }

        delete req.body.id;
        const course = await Course.findById(id);
        if (!isOwner(course, req)) return res.redirect('/courses');

        const editedCourse = {
            title: req.body.title,
            price: req.body.price,
            userId: req.user._id,
            desc: req.body.description
        }

        if (req.files.courseImage) {
            editedCourse.img = req.files.courseImage[0].path;
        }
        Object.assign(course, editedCourse);
        await course.save();
        res.redirect('/courses');
    } catch (err) {
        console.log(err);
    }
});

router.post('/remove', auth, async (req, res) => {
    try {
        await Course.deleteOne({
            _id: req.body.id,
            userId: req.user._id
        });
        res.redirect('/courses');
    } catch (err) {
        console.log(err);
    }
});

router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).lean();
        const latestCourses = await Course.find({'_id': {$ne: req.params.id}}).sort({'_id':-1}).limit(4);

        res.render('course', {
            title: `Course: ${course.title}`,
            userId: req.user ? req.user._id.toString() : null,
            course,
            courses: latestCourses
        });
    } catch (err) {
        console.log(err);
    }
});

module.exports = router;