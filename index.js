const express = require('express')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')

const cors = require('cors')
const bodyParser = require('body-parser');
const {Schema} = mongoose;
const app = express()
const {body,validationResult} = require('express-validator')
const port = process.env.PORT || 5000
const jwtSec = "qwertyuiopasdfghjklzxcvbnm"
const mongoURI = 'mongodb+srv://root:root@merncluster.xo3u5rg.mongodb.net/food-mern-finaldb?retryWrites=true&w=majority'
app.use(cors())
app.use(express.json())

const mongoDB = async () => {
  try {
    await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Connected to MongoDB");

    const collection = mongoose.connection.db.collection("food-items-collection");
    const data = await collection.find({}).toArray();

    const collection2 = mongoose.connection.db.collection("food-catogery-collection");
    const data2 = await collection2.find({}).toArray();
    
    global.food_items = data;
    global.food_catogery = data2;
    
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  } 
};
const UserSchema = new Schema({
  name:{
    type:String,
    required:true
  },
  location:{
    type:String,
    required:true
  },
  email:{
    type:String,
    required:true
  },
  password:{
    type:String,
    required:true
  },
  date:{
    type:Date,
    default:Date.now
  }


})

const User = mongoose.model('user',UserSchema);

const OrderSchema = new Schema({
  email: {
      type: String,
      required: true,
      unique: true
  },
  order_data: {
      type: Array,
      required: true,
  },

});

const Order = mongoose.model('order',OrderSchema)


mongoDB();
app.get('/',(req,res)=>{
    res.send('Hello World')
})

app.post('/foodData',(req,res)=>{
  try{
    res.send([global.food_items,global.food_catogery])
  }catch(error)
  {
    console.log(error.message);
    res.send("Server Error")
  }
})

app.post('/createuser',[
  body('email').isEmail(),
  body('password').isLength({min:5}),
  body('name').isLength({min:5})
]
,async (req,res)=>{
  const errors = validationResult(req)
  if(!errors.isEmpty()) return res.status(400).json({errors:errors.array()}) 

  
  let secPassword = req.body.password
 
  try{
    await User.create({
      name:req.body.name,
      password:secPassword,
      email : req.body.email,
      location:req.body.location
    })
    res.json({sucess:true})
  }catch(error)
  {
    console.log(error)
    res.json({sucess:false})
  }
})

app.post('/loginuser',
async (req,res)=>{
  console.log(req.body)
  const { email, password } = req.body;
  try{
    let userData= await User.findOne({email:email})
    console.log(userData)
    if(userData===null){
      return res.status(400).json({errors:"Try 1 Logging with correct credentials"})
    }
    const pwdCmp = req.body.password
    if(userData.password !== pwdCmp)
    {
      return res.status(400).json({errors:"Try 2 Logging with correct credentials"})
    }
    const data = {
      user:{
        id:userData._id
      }
    }
    const authToken = jwt.sign(data,jwtSec)
    return res.json({sucess:true,authToken:authToken})
  }
  catch(error)
  {
    console.log(error)
    res.json({sucess:false})
  }
})

app.post('/orderData', async (req, res) => {
  let data = req.body.order_data
  await data.splice(0,0,{Order_date:req.body.order_date})
  console.log("1231242343242354",req.body.email)

  //if email not exisitng in db then create: else: InsertMany()
  let eId = await Order.findOne({ 'email': req.body.email })    
  console.log(eId)
  if (eId===null) {
      try {
          console.log(data)
          console.log("1231242343242354",req.body.email)
          await Order.create({
              email: req.body.email,
              order_data:[data]
          }).then(() => {
              res.json({ success: true })
          })
      } catch (error) {
          console.log(error.message)
          res.send("Server Error", error.message)

      }
  }

  else {
      try {
          await Order.findOneAndUpdate({email:req.body.email},
              { $push:{order_data: data} }).then(() => {
                  res.json({ success: true })
              })
      } catch (error) {
          console.log(error.message)
          res.send("Server Error", error.message)
      }
  }
})

app.post('/myOrderData', async (req, res) => {
  try {
      console.log(req.body.email)
      let eId = await Order.findOne({ 'email': req.body.email })
      //console.log(eId)
      res.json({orderData:eId})
  } catch (error) {
      res.send("Error",error.message)
  }
  

});

app.listen(port,()=>{
    console.log("Server is running on port 5000")
})
