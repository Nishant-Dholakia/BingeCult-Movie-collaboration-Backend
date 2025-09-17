import { Group } from "../config/Group.js";
import {User} from '../config/User.js';


export const getAllGroups = async (req,res)=>{
    console.log("Inside getAllGroups");
    const user = req.user;
  if(!user){
    return res.status(400).json({ success: false, message : 'User not found'});
  }
    try
    {
        // console.log("User groups:", user.groups);
        const groups = await Group.find({ _id: { $in: user.groups } }).select('-createdAt -updatedAt -__v');

        for (const group of groups) {
            group.members = await User.find({ _id: { $in: group.members } }).select('_id username displayName');
            group.admins = await User.find({ _id: { $in: group.admins } }).select('_id username displayName');
        }
        // console.log("Fetched groups:", groups);
        return res.status(200).json({ success: true, data : groups, message : 'Groups fetched successfully...'});

    }
    catch(err)
    {
        console.log(err);
        return res.status(400).json({ success: false, message : err.message});
    }
    
    
};



export const addGroup = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "User not authorized" });
    }

    const { name, description } = req.body;

    // Validate input
    if (!name) {
      return res.status(400).json({ success: false, message: "Group name is required" });
    }

    const newGroup = new Group({
      name,
      description,
      members: [user._id],   
      admins: [user._id]     
    });

    const savedGroup = await newGroup.save();

    await User.findByIdAndUpdate(user._id, {
      $push: { groups: savedGroup._id }
    });

    return res.status(201).json({ success: true, message: "Group created successfully", group: savedGroup });
  } catch (err) {
    console.error(err);
  return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};
