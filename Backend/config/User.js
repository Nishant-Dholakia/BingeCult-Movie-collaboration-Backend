const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
    displayName: {
    type: String,
    trim:true
    },
  avatar: String, // profile picture URL
  groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group' // Reference to Group model
  }],
  
},{ timestamps: true });

module.exports = mongoose.model('User', userSchema);



// User {
//   _id: ObjectId,
//   username: String,
//   email: String,
//   passwordHash: String,
//   displayName: String,
//   avatar: String,           // profile pic URL (optional)
//   groups: [ObjectId],       // references Group._id
//   createdAt: Date,
//   updatedAt: Date
// }
