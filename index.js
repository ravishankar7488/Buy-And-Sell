const express=require("express");
const app=express();
const method_override=require("method-override")
app.use(method_override("_method"));
app.use(express.urlencoded({extended:true}));
const cookieParser=require("cookie-parser");
require('dotenv').config();

const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const session = require('express-session');
const flash= require("connect-flash")
const sessions=require("express-session");
app.use(cookieParser("devil"));

//connect-flash
app.use(sessions())
app.use(flash())

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'otp_secret', resave: false, saveUninitialized: true }));

// Email transporter setup (use your Gmail credentials or app password)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // MUST be false
  auth: {
    user: process.env.GMAIL,
    pass: process.env.PASS,
  },
});

const ExpressError= require("./utils/expressError.js");
const wrapAsync= require("./utils/wrapAsync.js")

const multer  = require('multer')
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log(req.body)
    if(file.fieldname==="profileImage"){cb(null, './public/uploads/profileImages')}
    else{cb(null, './public/uploads/productImages')}
  },
  filename: function (req, file, cb) {
    const fn=file.originalname;
    cb(null, fn)
  }
})
const upload = multer({ storage: storage })

const mongoose = require('mongoose');//db setup
main().then(()=>{
  console.log("Connection with DB established");
})
.catch(err => console.log(err));

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  } 
const User= require("./models/users.js")
const Product= require("./models/products.js")
const Order= require("./models/orders.js")
const Cart= require("./models/carts.js")
const Notification= require("./models/notifications.js")
const Review= require("./models/reviews.js")

const ejsMate= require("ejs-mate");
app.engine("ejs", ejsMate);

const path=require("path");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "/public")));
app.set("view engine", "ejs");



//routes
app.get("/", wrapAsync(async (req,res)=>{
  const products = await Product.find({});
  res.render("homepage.ejs", {products , activePage:"Home"});
}))


//Authenication Middlewares
app.use("/buyandsell/postlogin", wrapAsync( async(req,res,next)=>{
  id=req.signedCookies.id;
  let result=await User.findById(id)
  if(result)next();
  else{
    throw new ExpressError(500, "Please Login First 🤷‍♂️")
  }
}))
app.use("/buyandsell/postlogin/merchant", wrapAsync( async(req,res,next)=>{
  id=req.signedCookies.id;
  let result=await User.findById(id)
  if(result.role=="merchant")next();
  else{
    throw new ExpressError(500, "ACCESS DENIED")
  }
}))
app.use("/buyandsell/postlogin/customer", wrapAsync( async(req,res,next)=>{
  id=req.signedCookies.id;
  let result=await User.findById(id)
  if(result.role=="customer")next();
  else{
    throw new ExpressError(500, "ACCESS DENIED")
  }
}))

//My account
app.get("/buyandsell/postlogin/user", wrapAsync(async (req,res)=>{
  id=req.signedCookies.id;
  const user = await User.findById(id);
  res.render("myaccount.ejs", {user, activePage:"account"});
}))

//update account
app.get("/buyandsell/postlogin/updateprofile", wrapAsync(async (req,res)=>{
  id=req.signedCookies.id;
  const user = await User.findById(id);
  res.render("updateaccount.ejs", {user, activePage:" "});
}));

app.post("/buyandsell/postlogin/updateprofile", upload.single('profileImage'), wrapAsync(async (req,res)=>{
  id=req.signedCookies.id;
  const {fname, femail, fphone, flandmark, fpin, fstate, fcity, foldpassword, fnewpassword}= req.body;
  const user = await User.findById(id);
  
  if(user.password !== foldpassword) {
    return res.send("Old password is incorrect");
  }
  user.name = fname || user.name;
  user.email = femail || user.email;
  user.contact.phone = fphone || user.contact.phone;
  user.contact.address = flandmark || user.contact.address;
  user.contact.pincode = fpin || user.contact.pincode;
  user.contact.state = fstate || user.contact.state;
  user.contact.city = fcity || user.contact.city;
  if(fnewpassword) {
    user.password = fnewpassword;
  }
  if(req.file) {
    user.profileImage = "/uploads/profileImages/" + req.file.originalname;
  }
  
  const result = await user.save();
  res.redirect("/buyandsell/postlogin/user");
}))

//view product
app.get("/buyandsell/postlogin/user/viewproduct/:pid", wrapAsync(async (req,res)=>{
  const {pid}=req.params;
  let uid=req.signedCookies.id;
  const product = await Product.findById(pid);
  const user = await User.findById(uid);
  const reviews = await Review.find({productId:pid}).sort({ createdAt: -1 });
  res.render("viewproduct.ejs", {user, product, reviews, activePage:" "});
}))

//comment
// Add
app.post("/buyandsell/postlogin/addcomment/:pid/:uname", wrapAsync(async (req, res)=>{
  const {pid, uname}=req.params;
  uid=req.signedCookies.id;
  const {comment}=req.body;
  console.log(uid+" "+pid+" "+comment)
  const review = new Review({
    reviewerId:uid,
    productId:pid,
    comment:comment,
    reviewerName:uname
  });
  const result = await review.save();
  console.log(result);
  res.redirect(`/buyandsell/postlogin/user/viewproduct/${pid}`);
}))

//delete comment:
app.delete(("/buyandsell/postlogin/deletecomment/:pid/:rid"), wrapAsync(async (req,res)=>{
  const {pid, rid}=req.params
  uid=req.signedCookies.id;
  const result = await Review.findByIdAndDelete(rid);
  console.log(result);
  res.redirect(`/buyandsell/postlogin/user/viewproduct/${pid}`);
}))

//login
app.get("/buyandsell/login", wrapAsync( async (req,res)=>{
  res.render("login.ejs")
}))

app.post("/buyandsell/login", wrapAsync(async (req,res)=>{
  const {femail, fpassword}=req.body;

  const result = await User.findOne({email:femail});
  if(!result){
    res.send("User Not Registered");
  }
  else{
    const pw=result.password;
    if(pw===fpassword){
      res.cookie("id",result._id,{signed:true});

      res.redirect("/buyandsell/postlogin/home");
    }
    else{
      res.send("Password Mismatch.");
    }
  }
}))

//notification:
app.get("/buyandsell/postlogin/getnotification", wrapAsync(async (req,res)=>{
  let uid=req.signedCookies.id;
  const notifications = await Notification.find({receiverId:uid}).sort({ createdAt: -1 });
  const user = await User.findById(uid);
  await User.findByIdAndUpdate(uid, {isRead:true});
  res.render("shownotifications.ejs", {notifications, user, activePage:"notifications"});
}))

//delete Notification:
app.get(("/buyandsell/postlogin/deletenotification/:nid"), wrapAsync(async (req,res)=>{
  const {nid}=req.params;
  let uid=req.signedCookies.id;
  const result = await Notification.findByIdAndDelete(nid);
  res.redirect("/buyandsell/postlogin/getnotification");
}))

//show home page
app.get("/buyandsell/postlogin/home", wrapAsync(async (req,res)=>{
  let id=req.signedCookies.id;
  const products = await Product.find({}).sort({ createdAt: -1 });
  const user = await User.findById(id);
  if(user.role==="customer") res.render("customer.ejs",{user, products, activePage:"home"})
  else if(user.role==="merchant") res.render("merchant.ejs",{user, products, activePage:"home"})
}))

//signup
// Handle email submission
app.post('/send-otp', wrapAsync(async (req, res) => {
  console.log(req.body);

  const email = req.body.email;
  const otp = Math.floor(100000 + Math.random() * 900000);

  req.session.email = email;
  req.session.otp = otp;

  const mailOptions = {
    from: process.env.GMAIL,
    to: email,
    subject: 'Verification OTP for B&S',
    text: `Thank you for choosing Buy and Sell!
Your One-Time Password (OTP) is ${otp}. Please enter this code to verify your identity and proceed.
This code will expire in 5 minutes.
If you didn't request this, kindly ignore the message.`
  };

  await new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject(error);
      }
      resolve(info);
    });
  });
  
  res.render('verify');
}));

// Handle OTP verification
app.post('/verify-otp', wrapAsync(async (req, res) => {
  const email = req.params.email;
  const userOtp = req.body.otp;
  if (parseInt(userOtp) === req.session.otp) {
    setTimeout(() => {
      res.redirect('/buyandsell/signup/'+req.session.email);
    }, 1000);
  } else {
    res.send('❌ Invalid OTP. Try again.');
  }
}));

app.get("/buyandsell/signup_gmail", wrapAsync(async (req,res)=>{
  res.render("signup_gmail.ejs", {activePage:" "});
}));

app.get("/buyandsell/signup/:email", wrapAsync(async (req,res)=>{
  res.render("signup.ejs", {activePage:" ", email:req.params.email, alertMessage: 'Email verified! Please fill in the details to complete your registration.'});
}))

app.post("/buyandsell/signup", upload.single('profileImage'), wrapAsync(async (req,res)=>{
  const {fname, femail, fpassword, frole, fphone, faddress, fpincode, fstate, fcity, fgender}= req.body;
  console.log(req.file)
  const profileImage = req.file ? "/uploads/profileImages/"+req.file.originalname : "/uploads/profileImages/default-profile.png";
  const user = new User({
    profileImage: profileImage,
    gender: fgender,
    name:fname,
    email: femail,
    password: fpassword,
    role: frole,
    contact: {state: fstate, city: fcity, pincode: fpincode, phone: fphone, address: faddress},
    created_at:new Date()
  });
  
  const result = await user.save();
  const notification = new Notification({
    senderId: '68806542c7dad51e899c51a9',
    receiverId: result._id,
    message: `Welcome ${result.name}! You are successfully registered on BUY & SELL as a ${result.role} 🙏`
  });
  await notification.save();
  res.cookie("id",result._id,{signed:true});
  res.redirect("/buyandsell/postlogin/home");
}))

//merchantPages:
//add product:
app.get("/buyandsell/postlogin/merchant/addproduct", wrapAsync(async (req,res)=>{
  let id=req.signedCookies.id;
  const user = await User.findById(id);
  res.render("addproduct.ejs", {user, activePage:"addproductmerchant"});
}))

app.post("/buyandsell/postlogin/merchant/addproduct", wrapAsync(async (req,res)=>{
  let id=req.signedCookies.id;
  const {fbrand, ftitle, fimageurl, fdescription, fstock, fprice, fdiscountedprice, ftags}=req.body;
  const tagsArray = ftags.split(',').map(tag => tag.trim());
  const product = new Product({
    brand: fbrand,
    title: ftitle,
    description: fdescription,
    price: fprice,
    priceafterdiscount: fdiscountedprice,
    imageurl: fimageurl,
    stock: fstock,
    createdAt:new Date(),
    sellerId:id,
    tags:tagsArray
  });
  const result = await product.save();
  res.redirect("/buyandsell/postlogin/home");
}))

//my orders merchant
app.get("/buyandsell/postlogin/merchant/myorders", wrapAsync(async (req,res)=>{
  let id=req.signedCookies.id;
  const array = await Product.find({sellerId: id}, '_id');
  const orders = await Order.find({productId: { $in: array }});
  const user = await User.findById(id);
  res.render("neworders.ejs", {orders, user, activePage:"newordersmerchant"});
}))

//orderhistory
app.get("/buyandsell/postlogin/merchant/myordershistory", wrapAsync(async (req,res)=>{
  let id=req.signedCookies.id;
  const array = await Product.find({sellerId: id}, '_id');
  const orders = await Order.find({productId: { $in: array }}).sort({ createdAt: -1 });
  const user = await User.findById(id);
  res.render("merchantorderhistory.ejs", {orders, user, activePage:"orderhistorymerchant"});
}))

app.get("/buyandsell/postlogin/merchant/vieworder/:cid/:oid", wrapAsync(async (req,res)=>{
  const {cid, oid}=req.params;
  let uid=req.signedCookies.id;
  const customer = await User.findById(cid);
  const order = await Order.findById(oid);
  const user = await User.findById(uid);
  res.render("vieworder.ejs", {customer, order, user, activePage:" "});
}))

app.post("/buyandsell/postlogin/merchant/vieworder/updatestatus/:oid/:cid", wrapAsync(async (req,res)=>{
  const {oid, cid}=req.params;
  let uid=req.signedCookies.id;
  const {status}=req.body;
  
  const result = await Order.findByIdAndUpdate(oid, {status: status, createdAt: new Date()});
  const order = await Order.findById(oid);
  
  if(status==='Rejected'){
    const product = await Product.findById(order.productId);
    await Product.findByIdAndUpdate(product._id, {stock:product.stock+1, purchase: product.purchase-1});
  }
  
  const notification = new Notification({
    senderId:uid,
    receiverId:cid,
    message:`Your Order for product "${order.ordertitle}" has been "${status}"`
  });
  
  await notification.save();
  await User.findByIdAndUpdate(cid, {isRead: false});
  
  //notification for customer on mail
  const customer = await User.findById(cid);
  const cemail = customer.email;

  const mailOptions = {
    from: process.env.GMAIL,
    to: cemail,
    subject: 'Order status update',
    text: `Greetings Customer,
The status of your order "${order.ordertitle}" has been updated as "${status}". To view the order details and manage it, please click the link https://buy-and-sell-project.onrender.com/ to visit our website.
Warm regards,
The B&S Team"`
  };

  await new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject(error);
      }
      resolve(info);
    });
  });

  res.redirect("/buyandsell/postlogin/merchant/myorders");
}))

//my listed products
app.get("/buyandsell/postlogin/merchant/myproducts", wrapAsync(async (req, res)=>{
  let uid=req.signedCookies.id;
  const products = await Product.find({ sellerId: uid});
  const user = await User.findById(uid);
  res.render("merchantProducts.ejs", {user, products, activePage:"myproductsmerchant"});
}))

//edit product
//get form
app.get("/buyandsell/postlogin/merchant/edit/:pid", wrapAsync(async (req, res)=>{
  const {pid}= req.params;
  let uid=req.signedCookies.id;
  const user = await User.findById(uid);
  const product = await Product.findById(pid);
  res.render("editform.ejs", {user, product, activePage:" "});
}))

//update
app.post("/buyandsell/postlogin/merchant/edit/:pid", wrapAsync(async (req, res)=>{
  const {pid}= req.params;
  let uid=req.signedCookies.id;
  const {pprice, pstock, ptags}=req.body;
  const tagsArray = ptags.split(',').map(tag => tag.trim());
  const result = await Product.findOneAndUpdate({_id:pid}, {
    stock: pstock,
    priceafterdiscount: pprice,
    tags: tagsArray,
  });
  res.send(result);
}))


//customers
//my orders customer
app.get("/buyandsell/postlogin/customer/myorders", wrapAsync(async (req,res)=>{
  let uid=req.signedCookies.id;
  const user = await User.findById(uid);
  const orders = await Order.find({customerId: uid}).sort({ createdAt: -1 });
  res.render("orderhistory.ejs", {user, orders, activePage:"myorderscustomer"});
}))

//buy
app.get("/buyandsell/postlogin/customer/confirmation/buy/:pid", wrapAsync(async (req,res)=>{
  const {pid}= req.params;
  let uid=req.signedCookies.id;
  const product = await Product.findById(pid);
  const user = await User.findById(uid);
  res.render("order_confirmation.ejs", {product, user, activePage:" "});
}))

//buy and save order
app.get("/buyandsell/postlogin/customer/buy/:pid", wrapAsync(async (req,res)=>{
  const {pid}= req.params;
  let uid=req.signedCookies.id;
  const product = await Product.findById(pid);
  
  await Product.updateOne({_id:pid}, {stock:product.stock-1, purchase: product.purchase+1});
  
  const notification = new Notification({
    senderId:uid,
    receiverId:product.sellerId,
    message:`You have an order for your product ${product.title}, Stock remains: ${product.stock-1}. Check your New orders section for more details.`
  });
  
  await notification.save();
  await User.findByIdAndUpdate(product.sellerId, {isRead:false});

  //notifications for merchant
  const seller = await User.findById(product.sellerId);
  const mailOptions = {
    from: process.env.GMAIL,
    to: seller.email,
    subject: 'Order for your product',
    text: `Greetings Merchant,
You've received a new order for your product: ${product.title}. To view the order details and manage it, please click the link https://buy-and-sell-project.onrender.com/ to visit our website.
Warm regards,
The B&S Team"`
  };

  await new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject(error);
      }
      resolve(info);
    });
  });

  //customer
  const customer = await User.findById(uid);
  const cemail = customer.email;

  const mailOptions2 = {
    from: 'pravi5653no0987@gmail.com',
    to: cemail,
    subject: 'Order Confirmation',
    text: `Greetings Customer,
Your order for product: ${product.title} has been placed. To view the order details and manage it, please click the link https://buy-and-sell-project.onrender.com/ to visit our website.
Warm regards,
The B&S Team"`
  };
  
  await new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions2, (error, info) => {
      if (error) {
        reject(error);
      }
      resolve(info);
    });
  });

  const order = new Order({
    customerId: uid,
    amount: product.price,
    ordertitle: product.title,
    orderimage: product.imageurl,
    orderbrand: product.brand,
    orderdiscountedprice: product.priceafterdiscount,
    productId: pid,
  });
  
  await order.save();
  res.redirect("/buyandsell/postlogin/customer/myorders");
}))

//cart
app.get("/buyandsell/postlogin/customer/addtocart/:pid", wrapAsync(async (req, res)=>{
  const {pid}=req.params;
  let uid=req.signedCookies.id;
  const product = await Product.findById(pid);
  
  const cart = new Cart({
    customerId: uid,
    productId: pid,
    productImage: product.imageurl,
    productName: product.title,
    productPrice: product.price,
    discountedprice: product.priceafterdiscount,
    brand: product.brand,
    purchase: product.purchase
  });
  
  const result = await cart.save();
  res.redirect("/buyandsell/postlogin/customer/getcart");
}))

app.get("/buyandsell/postlogin/customer/getcart", wrapAsync(async (req,res)=>{
  let uid=req.signedCookies.id;
  const products = await Cart.find({customerId : uid}).sort({ addedToCartAt: -1 });
  console.log(products);
  const user = await User.findById(uid);
  res.render("cart.ejs", {products, user, activePage:"cart"});
}))

//delete from cart
app.get("/buyandsell/postlogin/customer/deletecart/:pid", wrapAsync(async (req,res)=>{
  const {pid}= req.params;
  let uid=req.signedCookies.id;
  const result = await Cart.findByIdAndDelete(pid);
  res.redirect("/buyandsell/postlogin/customer/getcart");
}))

//cancel order:
app.get("/buyandsell/postlogin/customer/cancelorder_request/:pid", wrapAsync(async (req,res)=>{
  const {pid}=req.params;
  let uid=req.signedCookies.id;
  const order = await Order.findOne({_id : pid});
  res.render("cancelorder.ejs", {pid, uid, activePage:" ", order});
}))

app.post("/buyandsell/postlogin/customer/cancelorder/:pid", wrapAsync(async (req,res)=>{
  const cancelReason=req.body.cancel_reason;
  if(!cancelReason) return res.send("Please provide a reason for cancellation");

  const {pid}=req.params;
  let uid=req.signedCookies.id;
  const result = await Order.findByIdAndUpdate(pid, {status: "Canceled By Customer", cancel_reason: cancelReason});
  const order = await Order.findById(pid);
  const prodId = order.productId;
  const product = await Product.findById(prodId);
  
  await Product.findByIdAndUpdate(prodId, {stock:product.stock+1, purchase: product.purchase-1});
  
  const notification = new Notification({
    senderId:uid,
    receiverId: product.sellerId,
    message: `Order for your product "${order.ordertitle}" has been canceled by Customer with reason: "${cancelReason}"`
  });
  
  await notification.save();
  await User.findByIdAndUpdate(product.sellerId, {isRead: false});
  res.redirect("/buyandsell/postlogin/customer/myorders");
}))

//search
app.post("/buyandsell/postlogin/search", wrapAsync(async (req, res)=>{
  let uid=req.signedCookies.id;
  const {searchedProduct}= req.body;
  searchedProduct?res.redirect(`/buyandsell/postlogin/search/${searchedProduct}`):res.redirect(`/buyandsell/postlogin/search/men`);
}))

app.get("/buyandsell/postlogin/search/:searchedProduct", wrapAsync(async (req,res)=>{
  const {searchedProduct}=req.params;
  let uid=req.signedCookies.id;

  const user = await User.findById(uid);
  const products = await Product.find({
    $or: [
      { title: { $regex: searchedProduct, $options: 'i' } },
      { tags: { $regex: searchedProduct, $options: 'i' } },
      { description: { $regex: searchedProduct, $options: 'i' } }
    ]
  });
  
  res.render("search.ejs",{user, products, searchedProduct, activePage:searchedProduct});
}))

//forgot password
app.get("/buyandsell/password_recovery", wrapAsync(async (req,res)=>{
  res.render("password_recovery.ejs", {activePage:" "});
}))

app.post("/buyandsell/password_recovery", wrapAsync(async (req,res)=>{
  const {femail,fpassword,pname}=req.body;
  const user = await User.findOne({email:femail});
  
  if(!user){
    res.send("User Not Registered");
  }
  else{
    user.password=fpassword;
    const result = await user.save();
    res.cookie("id",result._id,{signed:true});
    res.redirect("/buyandsell/postlogin/home");
  }
}))

// signout
app.get("/buyandsell/postlogin/signout", wrapAsync(async (req,res)=>{
  res.clearCookie("id");
  res.redirect("/")
}))

//error handling middlewares
app.use((req,res,next)=>{
  next(new ExpressError(404, "Page Not Found"))
});

app.use((err, req, res, next)=>{
  let {status=500, message="Something went wrong"}=err;
  // user=req.signedCookies.user;
  res.render("error.ejs", {status, message});
});

//routes end
app.listen(3000, ()=>{console.log("Server started at 3000");});
