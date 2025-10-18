import mongoose, { Schema } from "mongoose";
import  bcrypt from  "bcrypt"
import jwt from "jsonwebtoken"

const userSchema=   new Schema({
     username:{
        type:String,
        required: true,
     },
     email:{
        type:String,
        required:true,
    
     },
     password:{
        type:String,
        required:true
     },
     phoneNo:{
        type:String,
        required:true
     },
     isVerified:{
        type:Boolean,
        required:true,
       default: false 
     },
     emailVerified:{
        type:Boolean,
        default: false 
     },
     emailVerificationToken:{
        type:String
     },
     emailVerificationExpires:{
        type:Date
     },
     passwordResetToken:{
        type:String
     },
     passwordResetExpires:{
        type:Date
     },
     accessToken:{
        type:String
     },
     refreshToken:{
        type:String
     }

},{timestamps:true})

userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            firstName: this.firstName,
        
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:'1d'
        }
    )
}

  userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
      {
        _id: this._id,
      },
      process.env.REFRESH_TOKEN_SECRET, 
      {
        expiresIn:'7d', 
      }
    );};


export const User= mongoose.model("User",userSchema);