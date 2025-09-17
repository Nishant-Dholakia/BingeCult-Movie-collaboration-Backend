import jwt from 'jsonwebtoken';
import { User } from '../config/User.js';


export const authMiddleware = (fieldsToExclude = ['password']) => async (req, res, next) => {
  try {
    // 1. Get token from cookies
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Find the user from decoded.id
    const excludeString = fieldsToExclude.map(f => `-${f}`).join(' ');

    const user = await User.findById(decoded.id).select(excludeString);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = user;
    // 4. Move to next middleware/route
    next();
  } catch (err) {
    console.error(err);
  res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};
