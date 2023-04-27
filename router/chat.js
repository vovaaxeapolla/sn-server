const Router = require('express').Router;
const router = new Router();
const chatController = require('../controllers/chat-controller');
const authMiddleware = require('../middlewares/auth-middleware');

router.get('/accounts', authMiddleware, chatController.chats);
router.post('/dialog/:id/publish', authMiddleware, chatController.publish.bind(chatController))
router.post('/dialog/:id/subscribe', authMiddleware, chatController.subscribe.bind(chatController))
router.post('/dialog/:id/history', authMiddleware, chatController.history)

router.post('/dialog', authMiddleware, chatController.dialogCreate);
router.get('/dialogs/:id', authMiddleware, chatController.dialogsGet);
router.get('/dialog/:id', authMiddleware, chatController.dialogGet);

module.exports = router;