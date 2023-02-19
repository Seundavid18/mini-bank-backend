const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const User = require("../models/usermodel")
const validateUser = require("../validation/validateUser")
const sendMail = require("../utils/sendmail")

// desc => create a new account
// route =>POST/api/createaccount
const createaccount = async(req, res)=>{
    try{
        let { email, fullName, password, pin} = req.body
      
        const accountNumber =  Math.floor((Math.random() * 1000000)+1 ) 

        const {error} = validateUser(req.body)
        if(error) return res.status(200).json({success: false, message: error.details[0].message})
      
        const findaccount = await User.findOne({email})
      
        if(findaccount) return res.status(200).json({
            success: false,
            message:"user exist"
        })
      
        const hashedPassword = await bcrypt.hash(password,12)
      
        const hashedPin = await bcrypt.hash(pin, 12)
      
        password = hashedPassword
      
        pin = hashedPin
      
        const newUser = await new User({email, fullName, password, accountNumber, pin})
      
        await newUser.save()
      
        res.status(201).json({
            success: true,
            message: "you have successfully created an account",
            data:newUser
        })
    }catch(error){
        res.status(500).json({
            success: false,
            message:error.message
        })
        console.log(error)
    }
   
    
}

// desc => log in
// route =>POST/api/login
const login = async(req,res)=>{
    try{
        // const password = req.body.password
       
        // const accountNumber = req.body.accountNumber
        const {email, password} = req.body
       
        const user = await User.findOne({email: email})
       
        if(!user) return res.status(200).json({success:false,msg:"Email address does not exist"})
       
        const validaccount = await bcrypt.compare(password, user.password)
       
        if(!validaccount) return res.status(200).json({success:false, msg:"Invalid login details"})
       
        const token = jwt.sign({accountNumber:user.accountNumber,email:user.email,_id:user._id,fullName:user.fullName},process.env.SECRET,{expiresIn:"1d"})
       

        // send email alert for log in
        try{
            await sendMail({
                email:user.email,
                subject:"login alert",
                message:`you successfully logged into your account at ${Date()}`
            })
        }catch(error){
            console.log(error)
            return res.status(500).json({
                success:false,
                msg:error.message
            })
            
        }

        res.status(200).json({
            success:true,
            msg:"successfully logged in",
            data: user,
            token:token
        })
    }catch(error){
        console.log(error)
        return res.status(401).json({
            success:false,
            msg:error.message
        })
    }
   
}


// update => update user
// route =>PUT/api/update

const updateUser = async (req, res, next) =>  {
    if (req.body.userId === req.params.id) {
        try {
          const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            {
              $set: req.body,
            },
            { new: true }
          );
          res.status(200).json(updatedUser);
        } catch (err) {
          res.status(500).json(err);
        }
      } else {
        res.status(401).json("You can update only your account!");
      }
}

// desc => deposit money
// route =>POST/api/deposit

const cashDeposit = async(req,res)=>{
    try{
        const {accountNumber, amount, fullName} = req.body
        
        const findaccount = await User.findOne({accountNumber, fullName})
       
        if(!findaccount) return res.status(200).json({success:false,msg:`Account number ${accountNumber} or account name ${fullName} does not exist`})
        
        findaccount.balance = Number(amount) + findaccount.balance

        findaccount.transactionHistory.push({
            msg:`Your acct has been credited with ${amount} from ${findaccount.fullName} at ${Date()}`,
            depositorName: findaccount.fullName,
            amount: amount,
            timeStamps: Date()
        })
       
        await findaccount.save()

        // send credit alert
        try{
            await sendMail({
                email:findaccount.email,
                subject:"credit alert",
                message:`your account has been credited with ${amount} at ${Date()}`
            })
        }catch(error){
            console.log(error)
            return res.status(500).json({
                success:false,
                msg:error.message
            })
            
        }
       
        res.status(200).json({success:true,msg:`$${amount} was credited into your account ${findaccount.fullName} ${accountNumber} at ${Date()}`,balance:findaccount.balance,depositorName:findaccount.fullName})
   
    }catch(error){
        res.status(404).json({success:false,msg:error.message})
    }
   
}


// desc => transfer money
// route =>POST/api/transfer
const transfer = async(req,res)=>{
    try{
        const {accountNumber,amount,pin, fullName} = req.body
    // const {_id} = req.user
    const id = req.params.id
    
    
   
    const findaccountDebit = await User.findById(id)
  
   
    const validuser = await bcrypt.compare(pin,findaccountDebit.pin)
   
    if(!validuser) return res.status(200).json({success:false,msg:"invalid pin"})
   
    const findaccountCredit = await User.findOne({accountNumber, fullName})
   
    if(!findaccountCredit) return res.status(200).json({success:false,msg:`Account number ${accountNumber} or account name ${fullName} does not exist`})
   
    if(findaccountDebit.balance<amount) return res.status(200).json({success:false,msg:"insufficient balance"})
    
    const findaccountName = await User.findOne({fullName})

    if(!findaccountName) return res.status(404).json({success:false,msg:`Account name ${fullName} does not exist`})
   
    findaccountDebit.balance = findaccountDebit.balance - Number(amount)
    
    findaccountCredit.balance = findaccountCredit.balance + Number(amount)

    findaccountDebit.transactionHistory.push({
        msg:`You've successfully sent $${amount} from your account ${findaccountDebit.fullName} to ${findaccountCredit.fullName} at ${Date()}`,
        transferTo: findaccountCredit.fullName,
        amount: amount,
        timeStamps: Date()
    })
    
    findaccountCredit.transactionHistory.push({
        msg:`Transfer from ${findaccountDebit.fullName} your account has been credited with ${amount} at ${Date()}`,
        transferFrom: findaccountDebit.fullName,
        amount: amount,
        timeStamps: Date()
    })
   
    await findaccountDebit.save()
   
    await findaccountCredit.save()

     // send credit alert
     try{
        await sendMail({
            email:findaccountCredit.email,
            subject:"credit alert",
            message:`Your account has been credited with ${amount} from ${findaccountDebit.fullName} at ${Date()}`
        })
    }catch(error){
        console.log(error)
        return res.status(500).json({
            success:false,
            msg:error.message
        })
        
    }

    // send debit alert
    try{
        await sendMail({
            email:findaccountDebit.email,
            subject:"debit alert",
            message:`Your account has been debited with ${amount} transfer to ${findaccountCredit.fullName} at ${Date()}`
        })
    }catch(error){
        console.log(error)
        return res.status(500).json({
            success:false,
            msg:error.message
        })
        
    }

   
    res.status(200).json({success:true,msg:`You've successfully sent $${amount} from your account ${findaccountDebit.fullName} to ${findaccountCredit.fullName} at ${Date()}`,balance:findaccountDebit.balance,accountName:findaccountCredit.fullName})



    }catch(error){
        res.status(404).json({success:false,msg:error.message})
    }
    

}

// desc => get a logged in user details
// route =>GET/api/getaccount
const getAccount = async(req,res)=>{
    try{
        // const {accountNumber} = req.user
        const id = req.params.id
       
        const findaccount = await User.findById(id)
       
        const data = {
            _id:findaccount._id,
           email: findaccount.email,
           fullName: findaccount.fullName,
           accountNumber:findaccount.accountNumber,
           balance:findaccount.balance,
           transactionHistory:findaccount.transactionHistory
        }
      
        res.status(200).json({success:true,data:data})
   
    }catch(error){
        res.status(404).json({success:false,msg:error.message})
    }
}


// desc => get a logged in transaction history
// route =>GET/api/transactionhistory
const transactionHistory = async(req,res)=>{
    try{
        // const {accountNumber} = req.user
        // const {accountNumber} = req.params.accountNumber
        const id = req.params.id
        
       
        // const findaccount = await User.findOne({accountNumber})
        const findaccount = await User.findById(id)
       
        const data = {
            balance:findaccount.balance,
            transactionHistory:findaccount.transactionHistory
        }
      
        res.status(200).json({success:true,data:data})
   
    }catch(error){
        res.status(400).json({success:false,msg:error.message})
    }
}

module.exports = {createaccount,login,updateUser,cashDeposit,transfer,getAccount,transactionHistory}



