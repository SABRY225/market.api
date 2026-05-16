const express = require('express');
const router = express.Router();
const inviteCtrl = require('../controllers/invitationSystem.controller');

router.get('/points', inviteCtrl.getSystemPoints);
router.patch('/points', inviteCtrl.updateSystemPoints);


module.exports = router;