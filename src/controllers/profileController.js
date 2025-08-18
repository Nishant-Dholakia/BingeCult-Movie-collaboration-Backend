const User = require('../config/User');

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
