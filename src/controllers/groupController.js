import { Group } from "../config/Group.js";
import { User } from '../config/User.js';
import { Watchlist } from "../config/Watchlist.js";
import { getWholeWatchlist } from "./watchListController.js";


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
      admins: [user._id],
      
    });

    const savedGroup = await newGroup.save();

    const newWatchlist = new Watchlist({
      groupId: savedGroup._id,
      movieList: [],
      seriesList: [],
    });

    const savedWatchlist = await newWatchlist.save();

    savedGroup.watchlist = savedWatchlist._id;
    await savedGroup.save();

    await User.findByIdAndUpdate(user._id, {
      $push: { groups: savedGroup._id }
    });

    return res.status(201).json({ success: true, message: "Group created successfully", group: savedGroup });
  } catch (err) {
    console.error(err);
  return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};


export const getGroupById = async (req,res) =>{
    const {id} = req.query;
    if(!id)
    {
      return res.status(400).json({message:"Group id not found",success:false});
    }
    const group = await Group.findById(id).select("-__v -updatedAt");
    if(!group)
    {
      return res.status(400).json({message:"Group not found",success:false});
    }
    group.members = await User.find({ _id : { $in : group.members } }).select('-createdAt -updatedAt -__v -password -isActive');
    if(group.watchlist)
      group.watchlist = await getWholeWatchlist(group.watchlist);
    console.log("sending group ");
    return res.status(200).json({message:'group fetched..',data : group,success:true});
};

export const getAdminGroups = async (req, res) => {
  console.log("Inside getAdminGroups");

  const user = req.user;
  if (!user) {
    return res.status(400).json({ success: false, message: "User not found" });
  }

  try {
    // Fetch all groups where the current user is an admin
    const groups = await Group.find({ admins: user._id }).select('-createdAt -updatedAt -__v');

    // Populate members with minimal fields (_id, username, displayName)
    const populatedGroups = await Promise.all(
      groups.map(async (group) => {
        const members = await User.find({ _id: { $in: group.members } })
                                  .select('_id username displayName');
        return {
          ...group.toObject(),
          members
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: populatedGroups,
      message: "Admin groups fetched successfully"
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


export const addMember = async (req, res) => {
  let { userId, groupId } = req.body;

  if (!userId) return res.status(400).json({ message: "User ID is required" ,success:false});

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found", success: false });

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found", success: false });

    if (group.members.includes(user._id)) {
      return res.status(400).json({ message: "User already in group", success: false });
    }

    group.members.push(user._id);
    await group.save();

    res.json({ message: "Member added successfully", member: user, success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", success: false });
  }
};