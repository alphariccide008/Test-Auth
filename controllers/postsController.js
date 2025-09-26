const Post = require("../models/postModel");
const { createPostSchema} = require('../middlewares/validators');

exports.getPosts = async (req, res) => {
    //this version of const is used when you're trying to get something from the Database 
    const {page} = req.query;
    //limit the post per page
    const postsPerPage = 10;

    try {
        let pageNum = 0;
        if(page < 1){
            pageNum = 0;

        }else{
            pageNum = page -1;
        }
        //Retrieving Post from Database 
        const results = await Post.find().sort({createdAt: -1}).skip(pageNum * postsPerPage).limit(postsPerPage).populate({
            path: 'userId',
            select: 'email'
        })
        //Sending the feedback from the user 
        res.status(200).json({
            success:true,
            message:'post',
            data: results,
        })
        
    } catch (error) {
        console.log(error)
    }
}


exports.createPost = async (req, res) =>{
   //get all the informtion inputed by the user 
   const {title, description} = req.body;
   //getting the userId
   const {userId} = req.user;
   try {
    //Validate the infomation send use the createpostschemavalidation
    const {error, value} = createPostSchema.validate({title, description, userId});
    //checking for error 
    if(error){
        res.status(400).json({
            success:false,
            message: error.details[0].message
        })
    }
    //Saving the created post in the Database 
    const result = await Post.create({
        title, description, userId,
    })
    //Sending a response to the User 
    res.status(200).json({
        success:true,
        message: "Post successfully Created",
        data:result
    })

   } catch (error) {
    console.log(error)
   }
}



exports.singlePost = async (req, res) => {
    //this version of const is used when you're trying to get something from the Database 
    const {_id} = req.query;


    try {
       
        //Retrieving Post from Database 
        const results = await Post.findOne({_id})
        
        //Sending the feedback from the user 
      if(results){
          res.status(200).json({
            success:true,
            message:'Single Post ',
            data: results,
        })
       
      }
       res.status(400).json({
            sucess:false,
            message: "Product not found"
        })
    } catch (error) {
        console.log(error)
    }
}

exports.updatePost = async (req, res) =>{
   //get all the informtion inputed by the user 
   const {_id} = req.query
   const {title, description} = req.body;
   //getting the userId
   const {userId} = req.user;
   try {
    //Validate the infomation send use the createpostschemavalidation
    const {error, value} = createPostSchema.validate({title, description, userId});
    //checking for error 
    if(error){
        res.status(400).json({
            success:false,
            message: error.details[0].message
        })
    }
    //Saving the created post in the Database 
    const exisitingPost = await Post.findOne({
        _id
    })
    if(!exisitingPost){
        return res.status(400).json({
            success:false, 
            message:"Post does not exist"
        })
    }
    //checking if the id doesnt correspond with the existing id 
    if(exisitingPost.userId.toString()!== userId){
        return res.status(400).json({
            success:false,
            message:"Unauthroized"
        })
    }
    //If it correspond then update the Post in the Database
    exisitingPost.title = title;
    exisitingPost.description = description; 
    //Save the changes to the database 
    const result = await exisitingPost.save()
    res.status(200).json({
        success:true,
        message:"Updated Post successfully"
    })


   

   } catch (error) {
    console.log(error)
   }
}



exports.deletePost = async (req, res) =>{
   //get all the informtion inputed by the user 
   const {_id} = req.query
   
   //getting the userId
   const {userId} = req.user;
   try {

    //Saving the created post in the Database 
    const exisitingPost = await Post.findOne({
        _id
    })
    if(!exisitingPost){
        return res.status(400).json({
            success:false, 
            message:"Post already unavailable"
        })
    }
    //checking if the id doesnt correspond with the existing id 
    if(exisitingPost.userId.toString()!== userId){
        return res.status(400).json({
            success:false,
            message:"Unauthroized"
        })
    }
    //If it correspond then delte the Post in the Database
    await Post.deleteOne({_id})
    res.status(200).json({
        sucess: true,
        message: "post deleted",
        

    })
    


   

   } catch (error) {
    console.log(error)
   }
}
