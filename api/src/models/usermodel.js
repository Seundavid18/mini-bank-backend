const mongoose = require("mongoose")

const userschema = new mongoose.Schema({
    email:{
        type:String,
        required:true
     },
     password:{
         type:String,
         require:true
     },
     fullName:{
         type:String
     },
     pin:{
         type:String,
         required:true
     },
     accountNumber:{
         type:Number,
         unique:true,
         trim:true
     },
     balance:{
         type:Number,
         default:0
     },
     transactionHistory:{
         type:Array
     },
     profilePicture: {
        type: String,
        default: ""
    }
},{timestamps:true})


const User = new mongoose.model("User",userschema)

module.exports = User