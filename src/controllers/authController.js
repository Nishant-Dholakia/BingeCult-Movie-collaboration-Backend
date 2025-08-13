const User = require("../config/User");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.registerUser = async (req, res) => {

    try
    {
        let { username, email, password } = req.body;

        const duplicate = await User.findOne({ $or: [{ username }, { email }] });
        if(duplicate) return res.status(400).json({ message: "Username or email already exists" });

        //password will be hashed in User model)
        const newUser = new User({ username, email, password ,displayName:username});
        await newUser.save();

        res.status(201).json({ message: "User registered successfully..." });
    }
    catch(err)
    {
        res.status(500).json({message:err.message});
    }
}

exports.loginUser = async (req,res)=>{

    let {email, password} = req.body;

    const user = await User.findOne({email});

    if(!user) return res.status(404).json({message : "Invalid email or password..."});

    const isMatch = await user.matchPassword(password);
    if(!isMatch)
    {
        return res.status(404).json({message : "Invalid email or password..."});
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,          // can't be accessed by JS
      secure: process.env.NODE_ENV === "production", // only HTTPS in prod
      sameSite: "strict",      // CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      message: "Login successful",
      user: {
        username: user.username,
        email: user.email,
        displayName: user.username,
      }
    });

};

exports.logoutUser = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
};

exports.getProfile = async (req, res) => {
    try {
    if (!req.user) return res.status(404).json({ message: 'User not found' });

    const { username, email, displayName , contact} = req.user;

    res.status(200).json({
      message: "Profile fetched successfully",
      user: { username, email, displayName , contact}
    });
  } catch(err) {
      res.status(500).json({message:"Error : " + err.message});
  }
};

const User = require('../models/User');

exports.updateProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log("req.body:", req.body);

    const allowedFields = ['username', 'email', 'displayName', 'avatar', 'contact'];

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        // Special handling for contact so partial updates work
        if (field === 'contact' && typeof req.body.contact === 'object') {
          updates.contact = {
            ...req.user.contact?.toObject?.(), // keep existing values
            ...req.body.contact                // overwrite with new ones
          };
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error: " + err.message });
  }
};
