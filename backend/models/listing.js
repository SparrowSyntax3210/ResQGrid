const mongoose = require("mongoose");

const ListingSchema = new mongoose.Schema({
    Image: {
        type: String,
    },
    Name: {
        type: String,
        required: true
    },
    Physical: {
        type: String,
        required: true
    },
    Location: {
        type: String,
        required: true
    },
    Contact: {
        type: String,   
        required: true
    }
});

module.exports = mongoose.model("Listing", ListingSchema);