const Router = require('express')
const router = new Router()
const controller = require('../controllers/userController')
const auth = require('../middlewares/auth');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'avatars/')
    },
    filename: function (req, file, cb) {
        let ext = file.originalname.substring(file.originalname.lastIndexOf('.'), file.originalname.length);
        cb(null, Date.now() + ext)
    }
});
const upload = multer({
    storage: storage
});

router.get('/getuser/:nickname', auth, controller.getUser);
router.post('/update/:nickname', [auth, upload.single('avatar')], controller.updateUser);
module.exports = router;