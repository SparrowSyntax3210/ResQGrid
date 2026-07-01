const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
    Name : {
        type:String,
        required: true
    },
    Email : {
        type:String,
        required: true
    },
    Password : {
        type: String,
        required: true
    },
    ContactNumber : {
        type : Number
    }
});

mongoose.model = ("User" , UserSchema);

module.exports = User;