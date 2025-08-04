const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    name:{
        type : String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
    },
    description: {
        type: String,
        trim: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    watchlist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Watchlist'
    }
},{timestamps: true});

module.exports = mongoose.model("Group",groupSchema);


// Group {
//   _id: ObjectId,
//   name: String,
//   description: String,
//   members: [ObjectId],      // User._id
//   admins: [ObjectId],       // User._id
//   watchlist: ObjectId,      // references Watchlist._id
//   createdAt: Date
// }
