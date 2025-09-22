import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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
    contact: {
      countryCode: { type: String, match: /^\+\d{1,4}$/}, // like +91, +1, etc.
      number: { type: String, match: /^\d{6,15}$/} // 6-15 digits
  },
  avatar: String, // profile picture URL
  isActive : {
    type : Boolean,
    default : true,
  },
  // friends: [{
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'User' // Reference to User model
  // }],
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
  console.log(bcrypt.decodeBase64(this.password));
  return await bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model('User', userSchema);



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
