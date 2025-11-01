import { User } from '../config/User.js';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from "google-auth-library";


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const issueAuthToken = (res, user, message = "Login successful") => {
  const token = jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    success: true,
    message,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
  });
};


export const registerUser = async (req, res) => {
  try {
    let { username, email, password, confirmPassword } = req.body;

    const missingFields = [];
    if (!username) missingFields.push('username');
    if (!email) missingFields.push('email');
    if (!password) missingFields.push('password');

    if (missingFields.length > 0) {
      return res.status(400).json({ success: false, message: `Missing required fields : ${missingFields.toString()}` });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    if(password !== confirmPassword)
    {
      return res.status(400).json({ success: false, message : 'Password does not match with Confirm Password.'})
    }

    username = username.toLowerCase();
    const duplicate = await User.findOne({ $or: [{ username }, { email }] });
  if (duplicate) return res.status(400).json({ success: false, message: 'Username or email already exists' });

    const newUser = new User({ username, email, password, displayName: username });
    await newUser.save();

  res.status(201).json({ success: true, message: 'User registered successfully...' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const loginUser = async (req, res) => {
  let { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ success: false, message: 'Invalid email or password...' });

  const isMatch = await user.matchPassword(password);
  if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid email or password...' });

  issueAuthToken(res, user, "Login successful");

};

export const googleLogin = async (req, res) => {
    try {
      console.log("Google login invoked");

      const { id_token } = req.body;
      if (!id_token)
        return res
          .status(400)
          .json({ success: false, message: "Missing Google ID token" });

      // Verify Google ID token
      const ticket = await client.verifyIdToken({
        idToken: id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();

      const { sub, email, name, picture } = payload;

      // 1. Find by Google ID
      let user = await User.findOne({ googleId: sub });

      // 2. If no Google ID user, try linking by email
      if (!user && email) {
        user = await User.findOne({ email });
        if (user) {
          user.googleId = sub;
          user.picture = picture || user.picture;
          await user.save();
        }
      }

      // 3. If still no user, create new
      if (!user) {
        user = new User({
          username: name,
          email,
          googleId: sub,
          password: sub,
          picture,
        });
        user.save()
      }

      // 4. Issue JWT cookie + response
      issueAuthToken(res, user, "Google login successful");
    } catch (err) {
      console.error("Google login error:", err);
      res
        .status(500)
        .json({ success: false, message: "Google login failed, try again" });
    }
  };

export const logoutUser = (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
};


export const verifyRequest = (req, res) => {
  const user = {
    id: req.user._id,
    username: req.user.username,
    email: req.user.email
  };
  res.status(200).json({ success: true, user });
}
  
    // const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, {
    //   expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    // });
  
    // res.cookie('token', token, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === 'production',
    //   sameSite: 'strict',
    //   maxAge: 7 * 24 * 60 * 60 * 1000,
    // });
  
    // res.status(200).json({ success: true, message: 'Login successful', user: {id:user._id, username: user.username, email: user.email } });