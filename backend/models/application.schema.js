const mongoose = require("mongoose");

const Application = new mongoose.Schema({
    guardianId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    
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
    },
    
    status: {
        type: String,
        enum: ["active", "closed"],
        default: "active"
    },
    priorityScore: {
    type: Number,
    default: 0
},

priorityLevel: {
    type: String,
    default: "Low"
},

priorityReason: {
    type: String,
    default: ""
},
})

module.exports = mongoose.model ("application" , Application);