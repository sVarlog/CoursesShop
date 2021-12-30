const {Router} = require('express');
const Order = require('../models/order');
const Course = require('../models/course');
const auth = require('../middleware/auth');
const router = Router();

router.get('/', auth, async (req, res) => {
    try {
        const orders = await Order.find({'user.userId': req.user._id }).populate('user.userId');
        
        const latestCourses = await Course.find().sort({'_id':-1}).limit(4);

        res.render('orders', {
            isOrder: true,
            title: 'Orders',
            userId: req.user ? req.user._id.toString() : null,
            orders: orders.map(el => {
                return {
                    ...el._doc,
                    price: el.courses.reduce((total, course) => total += course.count * course.course.price, 0)
                }
            }),
            courses: latestCourses
        });
    } catch (e) {
        console.log(e);
    }
});

router.post('/', auth, async (req, res)  => {
    try {
        const user = await req.user.populate('cart.items.courseId');
        const courses = user.cart.items.map(el => ({count: el.count, course: {...el.courseId._doc}}));

        const order = new Order({user: {name: req.user.name, userId: req.user}, courses});

        await order.save();
        await req.user.clearCart();

        res.redirect('/orders');
    } catch (e) {
        res.status(500);
        res.json({error: e});
    }
});

module.exports = router;