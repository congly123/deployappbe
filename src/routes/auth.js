const router = require('express').Router();
const authController = require('../controllers/AuthController');

router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/registry', authController.registry2);
router.post('/confirm-account', authController.confirmAccount);
router.post('/reset-otp', authController.resetOTP);
router.post('/confirm-password', authController.confirmPassword);
router.get('/users/:username', authController.getUserInfo);
router.post('/twiliosendOTP', authController.twiliosendOTP);
router.post('/twilioviryfyOTP', authController.twilioviryfyOTP);
router.put('/forgetpassword', authController.forgetpassword);
router.post('/checkuser', authController.checkuser);

module.exports = router;
