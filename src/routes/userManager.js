const router = require('express').Router();
const userManagerController = require('../controllers/UserManagerController');

router.get('', userManagerController.getList);
router.patch('/:id/:isActived', userManagerController.updateActived);
router.put('/isActived', userManagerController.updateisActived);
router.put('/isAdmin', userManagerController.updateisAdmin);
router.put('/isDeleted', userManagerController.updateisDeleted);
router.put('/updateuserbyid', userManagerController.updateuserbyid);

module.exports = router;
