const Router = require('express');
const router = new Router();
const controller = require('../controllers/forumController');
const auth = require('../middlewares/auth');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images/')
    },
    filename: function (req, file, cb) {
        let ext = file.originalname.substring(file.originalname.lastIndexOf('.'), file.originalname.length);
        cb(null, Date.now() + ext)
    }
});
const upload = multer({
    storage: storage
});

router.get('/', auth, controller.getPosts);
router.post('/create', [auth, upload.single('image')], controller.createPost);
router.get('/comments/:postid', auth, controller.getComments);
router.post('/addcomment', auth, controller.addComment);
module.exports = router;