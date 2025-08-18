const User = require("../config/User");
// const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.registerUser = async (req, res) => {

    try
    {
        let { username, email, password } = req.body;

        // Validate required fields
        const missingFields = [];
        if (!username) missingFields.push('username');
        if (!email) missingFields.push('email');
        if (!password) missingFields.push('password');
        
        if (missingFields.length > 0) {
            return res.status(400).json({ 
                message: "Missing required fields", 
                fields: missingFields 
            });
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ 
                message: "Invalid email format" 
            });
        }
        
        // Check minimum password length
        if (password.length < 6) {
          return res.status(400).json({ 
            message: "Password must be at least 6 characters long" 
          });
        }
        
        username = username.toLowerCase();
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
