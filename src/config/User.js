const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next(); // only hash if password is new/modified
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

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
