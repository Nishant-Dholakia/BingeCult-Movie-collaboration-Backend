
import {User} from "../config/User.js";



export const getSimilarusers = async (req, res) => {
    console.log("Inside getSimilarusers");
  const { username } = req.query;
  if (!username) return res.status(400).json({ message: "Username query is required" });

  try {
    // Search case-insensitive, partial match
    const users = await User.find({
      username: { $regex: username, $options: "i" }
    }).limit(10); // limit results
    console.log("in users similar ",users);
    res.status(200).json({data : users, success : true, message : 'Users fetched successfully'});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};