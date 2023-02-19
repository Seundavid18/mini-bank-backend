const {createaccount,login,updateUser,cashDeposit,transfer,getAccount, transactionHistory} = require("../controller/usercontroller")
const express = require("express")
const router = express.Router()
const auth = require("../middleware/auth")

router.post("/createaccount",createaccount)
router.post("/login",login)
router.put("/update/:id", updateUser)
router.post("/deposit",cashDeposit)
router.post("/transfer/:id",transfer)
router.get("/getaccount/:id",getAccount)
router.get("/transactionhistory/:id",transactionHistory)

module.exports =router
