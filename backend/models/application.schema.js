const mongoose = require("mongoose");

const Application = new mongoose.Schema({
    Name:{
        type:String,
        required:true
    },
    Age:{
        type:Number,
        required:true
    },
    Gender:{
        type:String,
        required:true
    },
    Height:{
        type:String,
        required:true
    },
    Clothing:{
        type:String,
        required:true
    },
    MedicalConditions:{
        type:String,
        required:true
    },
    LastSeen:{
        type:String,
        required:true
    },
    dateTime:{
        type:Date,
        required:true
    },
    Description:{
        type:String,
        required:true
    },
    GuardianContact:{
        type:Number,
        required:true
    },
    Photo:{
        type:String,
    }
})

module.exports = mongoose.model ("application" , Application);