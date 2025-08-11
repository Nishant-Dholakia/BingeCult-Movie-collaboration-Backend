const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Routes
router.get("/", (req, res) => {
  res.json({ message: "Auth route" });
});
router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.post('/logout', authController.logoutUser);

router.use(authMiddleware);
router.get("/profile", authController.getProfile);
module.exports = router;
