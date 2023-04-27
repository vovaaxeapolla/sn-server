const Router = require('express').Router;
const multer = require('multer');
const path = require('path');
const UserController = require('../controllers/user-controller');
const PostController = require('../controllers/post-controller');
const router = new Router();
const { body } = require('express-validator');
const authMiddleware = require('../middlewares/auth-middleware');
const uuid = require('uuid');
const chat = require('./chat');
router.use('/chat', chat);
const avatarStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images/avatars/')
    },
    filename: function (req, file, cb) {
        cb(null, `${uuid.v4() + path.extname(file.originalname)}`)
    }
})
const photosStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images/photos/')
    },
    filename: function (req, file, cb) {
        cb(null, `${uuid.v4() + path.extname(file.originalname)}`)
    }
})
const avatarUpload = multer({ storage: avatarStorage })
const photosUpload = multer({ storage: photosStorage })

router.post('/signup',
    body('email').isEmail(),
    body('fullname').isLength({ min: 6, max: 64 }),
    body('nickname').isLength({ min: 6, max: 16 }),
    body('password').isLength({ min: 6, max: 32 }),
    UserController.registration
);
router.post('/signin',
    body('email').isEmail(),
    body('password').isLength({ min: 6, max: 32 }),
    UserController.login
);
router.post('/logout', UserController.logout);
router.get('/activate/:link', UserController.activate);
router.get('/refresh', UserController.refresh);
router.post('/password/reset', body('email').isEmail(), UserController.resetPassword);
router.post(
    '/password/change',
    authMiddleware,
    body('oldPassword').isLength({ min: 6, max: 32 }),
    body('newPassword').isLength({ min: 6, max: 32 }),
    UserController.changePassword
);
router.get('/user/:nickname', authMiddleware, UserController.getUser);
router.post('/user', authMiddleware, UserController.changePesonalInfo);
router.get('/user/follow/:id', authMiddleware, UserController.follow);
router.get('/user/unfollow/:id', authMiddleware, UserController.unfollow);
router.get('/user/following/:id', authMiddleware, UserController.following)
router.get('/user/:id/followers/count', authMiddleware, UserController.followersCount);
router.get('/user/:id/followings/count', authMiddleware, UserController.followingsCount);
router.get('/user/:id/followers', authMiddleware, UserController.followers);
router.get('/user/:id/followings', authMiddleware, UserController.followings);
router.get('/user/:id/online', authMiddleware, UserController.online)


router.post('/avatar', authMiddleware, avatarUpload.single('avatar'), UserController.changeAvatar);
router.delete('/avatar', authMiddleware, UserController.deleteAvatar);

router.post('/posts', authMiddleware, photosUpload.array('photos', 8), PostController.createPost);
router.get('/posts', authMiddleware, PostController.getPosts);
router.get('/posts/user/:id/count', PostController.getPostsCount);
router.delete('/posts/:id', authMiddleware, PostController.deletePost);

router.post('/comment', authMiddleware, PostController.createComment);
router.get('/comment/:id', authMiddleware, PostController.getComments);

module.exports = router;