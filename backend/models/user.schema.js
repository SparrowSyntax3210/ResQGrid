const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    Name: {
        type: String,
        required: true,
    },
    Email: {
        type: String,
        required: true,
        unique: true,
    },
    Password: {
        type: String,
        required: true,
    },
    ContactNumber: {
        type: Number,
        required: true,
    },
    Role:{
        type:String
    },
    Coins: {
        type: Number,
        default:100
    }
});

const User = mongoose.model("User", UserSchema);

module.exports = User;