const {Schema, model} = require('mongoose');

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    name: String,
    username: String,
    password: {
        type: String,
        required: true
    },
    cart: {
        items: [
            {
                count: {
                    type: Number,
                    required: true,
                    default: 1
                },
                courseId: {
                    type: Schema.Types.ObjectId,
                    ref: 'Course',
                    required: true,
                }
            }
        ]
    },
    avatarUrl: String,
    resetToken: String,
    resetTokenExp: Date,
});

userSchema.methods.addToCart = function(course) {
    const items = [...this.cart.items];
    const index = items.findIndex(el => el.courseId.toString() === course._id.toString());

    index >= 0 ? items[index].count += 1 : items.push({courseId: course._id,count: 1});

    this.cart = {items};
    return this.save();
};

userSchema.methods.removeFromCart = function(course) {
    const items = [...this.cart.items];
    const index = items.findIndex(el => el.courseId._id.toString() === course._id.toString());

    items[index].count >= 2 ? items[index].count -= 1 : items.splice(index, 1);

    this.cart = {items};
    return this.save();
}

userSchema.methods.clearCart = function() {
    this.cart = {items: []}
    return this.save();
}

module.exports = model('User', userSchema);