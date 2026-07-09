const mongoose = require("mongoose");

const SightingSchema = new mongoose.Schema({

    caseId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Application",
        required:true
    },

    Name:{
        type:String,
        required:true
    },

    Description:String,

    Location:{
        type:String,
        required:true
    },

    Date:{
        type:Date,
        required:true
    },

    Time:{
        type:String,
        required:true
    },

    Photo:String,

    CompanionDetails:String

});

module.exports = mongoose.model("Sighting",SightingSchema);