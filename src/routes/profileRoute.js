const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const profileController = require("../controllers/profileController");

router.get("/", authMiddleware(['password']), profileController.getProfile);
router.put("/", authMiddleware(['password']), profileController.updateProfile);

module.exports = router;