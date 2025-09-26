const mongoose = require("mongoose");

const postSchema = mongoose.Schema({
    title:{
        type:String,
        required:[true, "title is required"],
        trim:true,
    },
    description:{
        type:String,
        required:[true, "Description is required"],
        trim:true,
    },
    userId:{
        // this is this what links the user to the post made 
        type:mongoose.Schema.Types.ObjectId, 
        ref:'User',
        required:true,
    }

},{
    timestamps:true
});

module.exports = mongoose.model('Post', postSchema);