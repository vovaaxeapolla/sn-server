const Router = require('express')
const router = new Router()
const controller = require('../controllers/authController')
const auth = require('../middlewares/auth');

router.post('/registration', controller.registration)
router.post('/login', controller.login)
router.get('/logout', controller.logout)
router.get('/isauth', controller.isAuth)


module.exports = router