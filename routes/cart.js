const {Router} = require('express');
const Course = require('../models/course');
const auth = require('../middleware/auth');
const router = Router();

function mapCartItems(cart) {
    return cart.items.map(el => ({...el.courseId._doc, count: el.count}));
}

function computePrice(courses) {
    return courses.reduce((total, course) => total += course.price * course.count, 0);
}
router.get('/', auth, async (req, res) => {
    const user = await req.user.populate('cart.items.courseId');
    const courses = mapCartItems(user.cart);
    
    const latestCourses = await Course.find().sort({'_id':-1}).limit(4);

    res.render('cart', {
        title: 'Cart',
        isCart: true,
        cartCourses: courses,
        courses: latestCourses,
        userId: req.user ? req.user._id.toString() : null,
        price: computePrice(courses)
    })
});

router.post('/add', auth, async (req, res) => {
    const course = await Course.findById(req.body.id).lean();
    await req.user.addToCart(course);
    res.redirect('/cart');
});


router.post('/remove/:id', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).lean();
        const user = await req.user.populate('cart.items.courseId');
        await req.user.removeFromCart(course);

        const courses = mapCartItems(user.cart);

        res.status(200).json({courses, price: computePrice(mapCartItems(user.cart))});
    } catch (err) {
        console.log(err);
        res.status(500);
        res.send(err);
    }
});

module.exports = router;