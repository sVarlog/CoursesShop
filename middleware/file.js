const multer = require('multer');

const storage = multer.diskStorage({
    destination(req, file, cb) {
        if (file.fieldname === 'courseImage') {
            cb(null, 'storage/images/courses');
        } else if (file.fieldname === 'avatar') {
            console.log('avatar');
            cb(null, 'storage/images/avatars');
        }
    },
    filename(req, file, cb) {
        cb(null, `${new Date().toISOString()}${file.originalname}`.replace(/:/g, '.'));
    }
});

const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg'];

const fileFilter = (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

module.exports = multer({storage, fileFilter});