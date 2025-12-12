const express=require("express");
const app=express();
const method_override=require("method-override")
app.use(method_override("_method"));
app.use(express.urlencoded({extended:true}));

const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const session = require('express-session');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'otp_secret', resave: false, saveUninitialized: true }));

// Email transporter setup (use your Gmail credentials or app password)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'pravi5653no0987@gmail.com',
    pass: 'pulg nwuf jymn bwmv'
  }
});


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
  await mongoose.connect('mongodb+srv://pravi5653no0987:Oc6IJ83zpYl2gVyi@cluster0.waryf2v.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
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
app.get("/", (req,res)=>{
  Product.find({}).then((products)=>{res.render("homepage.ejs", {products , activePage:"Home", alertMessage: 'Welcome back!' }
  )}).catch((error)=>{console.log(error)})
  
})
//My account
app.get("/buyandsell/user/:id", (req,res)=>{
  let {id}=req.params;
  User.findById(id).then((user)=>{res.render("myaccount.ejs", {user, activePage:"account"})}).catch((error)=>{res.send(error)})
})
//update account
app.get("/buyandsell/updateprofile/:id", (req,res)=>{
  let {id}=req.params;
  User.findById(id).then((user)=>{res.render("updateaccount.ejs", {user, activePage:" "})}).catch((error)=>{console.log(error)})
});
app.post("/buyandsell/updateprofile/:id", upload.single('profileImage'), (req,res)=>{
  let {id}=req.params;
  let {fname, femail, fphone, flandmark, fpin, fstate, fcity, foldpassword, fnewpassword}= req.body;
  User.findById(id).then((user)=>{
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
      user.password = fnewpassword; // Update password if new password is provided
    }
    if(req.file) {
      user.profileImage = "/uploads/profileImages/" + req.file.originalname; // Update profile image if a new file is uploaded
    }
    
    user.save().then((result)=>{res.redirect("/buyandsell/user/"+id,)}).catch((e)=>{    if (e.name === 'ValidationError') {
      // Handle validation error
      res.send(e.message);
    } else {
      // Handle other errors
      res.send(e);
    }})

  }).catch((error)=>{console.log(error)})
})

//view product
app.get("/buyandsell/user/viewproduct/:pid/:uid", (req,res)=>{
  let {pid, uid}=req.params;
  Product.findById(pid).then((product)=>{
    User.findById(uid).then((user)=>{
      Review.find({productId:pid}).sort({ createdAt: -1 }).then((reviews)=>{res.render("viewproduct.ejs", {user, product, reviews, activePage:" "})})}).catch((e)=>{})
      .then((error)=>{console.log(error)})
  }).then((error1)=>{console.log(error1)})
})

//comment
// Add
app.post("/buyandsell/addcomment/:uid/:pid/:uname", (req, res)=>{
  
  let {uid, pid, uname}=req.params;
  let {comment}=req.body;
  console.log(uid+" "+pid+" "+comment)
  let review=new Review({
    reviewerId:uid,
    productId:pid,
    comment:comment,
    reviewerName:uname
  });
  review.save().then((result)=>{console.log(result);res.redirect(`/buyandsell/user/viewproduct/${pid}/${uid}`)}).catch((error)=>{console.log(error)})
})
//delete comment:
app.delete(("/buyandsell/deletecomment/:uid/:pid/:rid"),(req,res)=>{
  let {uid, pid, rid}=req.params
  Review.findByIdAndDelete(rid).then((result)=>{console.log(result);res.redirect(`/buyandsell/user/viewproduct/${pid}/${uid}`)}).catch((error)=>{})
})

app.post("/buyandsell/login", (req,res)=>{
  let {femail, fpassword}=req.body;

  User.findOne({email:femail})
  .then((result)=>{
    if(!result){res.send("User Not Registered")}
    else{
      let pw=result.password;
      if(pw===fpassword){res.redirect("/buyandsell/home/"+result._id)}
    else{res.send("Password Mismatch");}
  }
})
  .catch((error)=>{res.send(error);});
}
)
//notification:
app.get("/buyandsell/customer/getnotification/:uid", (req,res)=>{
  let{uid}=req.params;
  Notification.find({receiverId:uid}).sort({ createdAt: -1 }).then((notifications)=>{
    User.findById(uid).then((user)=>{
      User.findByIdAndUpdate(uid, {isRead:true}).then((u)=>{res.render("shownotifications.ejs", {notifications, user, activePage:"notifications"})}).catch((e)=>{console.log(e)})
      
    }).catch((error)=>{console.log(error)})
  }).catch((err)=>{console.log(err)})
})
//delete Notification:
app.get(("/buyandsell/deletenotification/:nid/:uid"), (req,res)=>{
  let {nid, uid}=req.params;
  Notification.findByIdAndDelete(nid).then((result)=>{res.redirect("/buyandsell/customer/getnotification/"+uid)}).catch((error)=>{})
})

//show home page
app.get("/buyandsell/home/:who", (req,res)=>{
 let {who}=req.params;
 Product.find({}).sort({ createdAt: -1 }).then((products)=>{
    User.findById(who).then((user)=>{
      if(user.role==="customer") res.render("customer.ejs",{user, products, activePage:"home"})
      else if(user.role==="merchant") res.render("merchant.ejs",{user, products, activePage:"home"})
    }).then((error)=>{})
 }).catch((error1)=>{})
})

//signup
// Handle email submission
app.post('/send-otp', (req, res) => {
  console.log(req.body);

  const email = req.body.email;
  const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP

  req.session.email = email;
  req.session.otp = otp;

  const mailOptions = {
    from: 'pravi5653no0987@gmail.com',
    to: email,
    subject: 'Verification OTP for B&S',
    text: `Thank you for choosing Buy and Sell!
Your One-Time Password (OTP) is ${otp}. Please enter this code to verify your identity and proceed.
This code will expire in 5 minutes.
If you didn’t request this, kindly ignore the message.`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.send(error);
    }
    res.render('verify');
  });
});

// Handle OTP verification
app.post('/verify-otp', (req, res) => {
  const email = req.params.email;
  const userOtp = req.body.otp;
  if (parseInt(userOtp) === req.session.otp) {
    // res.send(`✅ Registration successful for ${req.session.email}`);
    setTimeout(() => {
    res.redirect('/buyandsell/signup/'+req.session.email);}, 1000);
  } else {
    res.send('❌ Invalid OTP. Try again.');
  }
});

app.get("/buyandsell/signup_gmail", (req,res)=>{
  res.render("signup_gmail.ejs", {activePage:" "});
});

app.get("/buyandsell/signup/:email", (req,res)=>{
  res.render("signup.ejs", {activePage:" ", email:req.params.email, alertMessage: 'Email verified! Please fill in the details to complete your registration.'});
})
app.post("/buyandsell/signup", upload.single('profileImage'), (req,res)=>{
  let {fname, femail, fpassword, frole, fphone, faddress, fpincode, fstate, fcity, fgender}= req.body;
  console.log(req.file)
  let profileImage = req.file ? "/uploads/profileImages/"+req.file.originalname : "/uploads/profileImages/default-profile.png"; // Handle file upload
  let user= new User({
  profileImage: profileImage,
  gender: fgender,
  name:fname,
  email: femail,
  password: fpassword,
  role: frole,
  contact: {state: fstate, city: fcity, pincode: fpincode, phone: fphone, address: faddress},
  created_at:new Date()
});
user.save().then((result)=>{
  let notification= new Notification({
    senderId: '68806542c7dad51e899c51a9',
    receiverId: result._id,
    message: `Welcome ${result.name}! You are successfully registered on BUY & SELL as a ${result.role} 🙏`
  });
  notification.save().then((r)=>{res.redirect("/buyandsell/home/"+result._id)})}).catch((e)=>{res.send(e.errmsg);console.log(e)})
  
  .catch((error)=>{console.log(error); res.send(error);})
})

//merchantPages:
//add product:
app.get("/buyandsell/merchant/addproduct/:id", (req,res)=>{
 let{id}=req.params;
 User.findById(id).then((user)=>{res.render("addproduct.ejs", {user, activePage:"addproductmerchant"})}).then((error)=>{console.log(error)})
})
app.post("/buyandsell/merchant/addproduct/:id", (req,res)=>{
  let {id}=req.params;
  let {fbrand, ftitle, fimageurl, fdescription, fstock, fprice, fdiscountedprice, ftags}=req.body;
  const tagsArray = ftags.split(',').map(tag => tag.trim());
  let product= new Product({
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
  product.save().then((result)=>{res.redirect("/buyandsell/home/"+id)}).catch((error)=>{res.send(error);})
})
//my orders merchant
app.get("/buyandsell/merchant/myorders/:id", (req,res)=>{
  let {id}= req.params
  Product.find({sellerId: id}, '_id').then((array)=>{
    Order.find({productId: { $in: array }}).then((orders)=>{User.findById(id).then((user)=>{res.render("neworders.ejs", {orders, user, activePage:"newordersmerchant"})}).catch((err)=>{console.log(err)})
      }).catch((error)=>{console.log(error)})
  })
  .catch((error1)=>{console.log(error1)})
})
//orderhistory
app.get("/buyandsell/merchant/myordershistory/:id", (req,res)=>{
  let {id}= req.params
  Product.find({sellerId: id}, '_id').then((array)=>{
    Order.find({productId: { $in: array }}).sort({ createdAt: -1 }).then((orders)=>{User.findById(id).then((user)=>{res.render("merchantorderhistory.ejs", {orders, user, activePage:"orderhistorymerchant"})}).catch((err)=>{console.log(err)})
      }).catch((error)=>{console.log(error)})
  })
  .catch((error1)=>{console.log(error1)})
})

app.get("/buyandsell/merchant/vieworder/:cid/:uid/:oid",(req,res)=>{
  let {cid, uid, oid}=req.params
  User.findById(cid).then((customer)=>{
    Order.findById(oid).then((order)=>{
      User.findById(uid).then((user)=>{
        res.render("vieworder.ejs", {customer, order, user, activePage:" "})
      })
      .catch((error1)=>{console.log(error)})
      
    })
  .catch((error)=>{console.log(error)})}).catch((err)=>{console.log(err)})
})
app.post("/buyandsell/merchant/vieworder/updatestatus/:uid/:oid/:cid", (req,res)=>{
  let {uid, oid, cid}=req.params;
  let {status}=req.body;
  Order.findByIdAndUpdate(oid, {status: status,  createdAt: new Date()}).then((result)=>{
    Order.findById(oid).then((order)=>{
      if(status==='Rejected'){
        Product.findById(order.productId).then((product)=>{
          Product.findByIdAndUpdate(product._id, {stock:product.stock+1, purchase: product.purchase-1}).then((r1)=>{}).catch((e1)=>{})
        }).catch((e)=>{})
      }
      let notification=new Notification({
      senderId:uid,
      receiverId:cid,
      message:`Your Order for product "${order.ordertitle}" has been "${status}"`
    })
    notification.save().then((r)=>{
      User.findByIdAndUpdate(cid, {isRead: false}).then((u)=>{
        res.redirect("/buyandsell/merchant/myorders/"+uid)
      }).catch((e)=>{})
      })
      .catch((e)=>{console.log(e)})
    }).catch((error1)=>{console.log(error1)})
//notification for customer on mail
User.findById(cid).then((customer)=>{
const email = customer.email;
  const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP

  req.session.email = email;
  req.session.otp = otp;

  const mailOptions = {
    from: 'pravi5653no0987@gmail.com',
    to: email,
    subject: 'Order status update',
    text: `Greetings Customer,
The status of your order "${result.ordertitle}" has been updated as "${status}". To view the order details and manage it, please click the link https://buy-and-sell-project.onrender.com/ to visit our website.
Warm regards,
The B&S Team"
`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.send('Error sending email');
    }
  });

}).catch((e)=>{console.log(e)})//notification for customer on mail

  }).catch((error)=>{console.log(error)})
})
//my listed products
app.get("/buyandsell/merchant/myproducts/:uid", (req, res)=>{
  let {uid}=req.params;
  Product.find({ sellerId: uid}).then((products)=>{
    User.findById(uid).then((user)=>{
      res.render("merchantProducts.ejs", {user, products, activePage:"myproductsmerchant"})
    }).catch((error)=>{console.log(error)})
  }).catch((error1)=>{console.log(error1)})
})
//edit product
//get form
app.get("/buyandsell/merchant/edit/:pid/:uid", (req, res)=>{
  let {uid, pid}= req.params;
  User.findById(uid).then((user)=>{
    Product.findById(pid).then((product)=>{
      res.render("editform.ejs", {user, product, activePage:" "})
    }).catch((error)=>{console.log(error)})
    
  }).catch((error1)=>{console.log(error1)})
})
//update
app.post("/buyandsell/merchant/edit/:pid/:uid", (req, res)=>{
  let {uid, pid}= req.params;
  let {pprice, pstock, ptags}=req.body;
  const tagsArray = ptags.split(',').map(tag => tag.trim());
  Product.findOneAndUpdate({_id:pid}, {
    stock: pstock,
    priceafterdiscount: pprice,
    tags: tagsArray,
  }).then((result)=>{res.send(result)}).catch((error)=>{res.send(error)})
})


//customers
//my orders customer
app.get("/buyandsell/customer/myorders/:uid", (req,res)=>{
  let {uid}=req.params;
  User.findById(uid).then((user)=>{Order.find({customerId: uid}).sort({ createdAt: -1 })
  .then((orders)=>{res.render("orderhistory.ejs", {user, orders, activePage:"myorderscustomer"})})
  .then((error)=>{console.log(error)})
    })
  .catch((error)=>{console.log(error)})
})

//buy
app.get("/buyandsell/customer/confirmation/buy/:pid/:uid", (req,res)=>{
  let {pid, uid}= req.params;
  Product.findById(pid).then((product)=>{
    User.findById(uid).then((user)=>{
      res.render("order_confirmation.ejs", {product, user, activePage:" "})
    }).catch((error)=>{console.log(error)})
  }).catch((error1)=>{console.log(error1)})
})
//buy and save order
app.get("/buyandsell/customer/buy/:pid/:uid", (req,res)=>{
  let {uid, pid}= req.params;
  Product.findById(pid).then((product)=>{
    Product.updateOne({_id:pid}, {stock:product.stock-1, purchase: product.purchase+1}).then((result)=>{
      let notification=new Notification({
        senderId:uid,
        receiverId:product.sellerId,
        message:`You have an order for your product ${product.title}, Stock remains: ${product.stock-1}. Check your New orders section for more details.`
      })
      notification.save().then((r)=>{User.findByIdAndUpdate(product.sellerId, {isRead:false}).then((r)=>{
//notifications
// merchant
User.findById(product.sellerId).then((seller)=>{
    const email = seller.email;
  const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP

  req.session.email = email;
  req.session.otp = otp;

  const mailOptions = {
    from: 'pravi5653no0987@gmail.com',
    to: email,
    subject: 'Order for your product',
    text: `Greetings Merchant,
You’ve received a new order for your product: ${product.title}. To view the order details and manage it, please click the link https://buy-and-sell-project.onrender.com/ to visit our website.
Warm regards,
The B&S Team"
`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.send('Error sending email');
    }
  });
  //customer
  User.findById(uid).then((customer)=>{
        const cemail = customer.email;
  const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP

  req.session.email = email;
  req.session.otp = otp;

  const mailOptions = {
    from: 'pravi5653no0987@gmail.com',
    to: cemail,
    subject: 'Order Confirmation',
    text: `Greetings Customer,
Your order for product: ${product.title} has been placed. To view the order details and manage it, please click the link https://buy-and-sell-project.onrender.com/ to visit our website.
Warm regards,
The B&S Team"
`
  };
   transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.send('Error sending email');
    }
  });



  }).catch((e)=>{})
}).catch((e)=>{})
//notifications
        
      }).catch((e)=>{})})
      .catch((e)=>{})
    }).catch((error)=>{console.log(error)})
      let order= new Order({
    customerId: uid,
    amount: product.price,
    ordertitle: product.title,
    orderimage: product.imageurl,
    orderbrand: product.brand,
    orderdiscountedprice: product.priceafterdiscount,
    productId: pid,
  })
 order.save().then(res.redirect("/buyandsell/customer/myorders/"+uid)).catch((error)=>{console.log(error)})
  }).catch((error)=>{console.log(error)})
})
//cart
app.get("/buyandsell/customer/addtocart/:pid/:uid", (req, res)=>{
  let {pid, uid}=req.params;
  Product.findById(pid).then((product)=>{
    let cart= new Cart({
      customerId: uid,
      productId: pid,
      productImage: product.imageurl,
      productName: product.title,
      productPrice: product.price
      , discountedprice: product.priceafterdiscount,
      brand: product.brand,
      purchase: product.purchase
    });
    cart.save().then((result)=>{res.redirect("/buyandsell/customer/getcart/"+uid)}).catch((error)=>{console.log(error)})
  }).catch((error1)=>{console.log(error1)})
  
})

app.get("/buyandsell/customer/getcart/:uid", (req,res)=>{
  let {uid}=req.params;
  // res.send(uid);
  Cart.find({customerId : uid}).sort({ addedToCartAt: -1 }).then((products)=>{
    console.log(products);
    User.findById(uid).then((user)=>{res.render("cart.ejs", {products, user, activePage:"cart"})})
    .catch((error1)=>{console.log(error1)})
  }).catch((error)=>{console.log(error)})
})
//delete from cart
app.get("/buyandsell/user/deletecart/:pid/:uid", (req,res)=>{
  let {pid, uid}= req.params;
  Cart.findByIdAndDelete(pid).then((result)=>{
    res.redirect("/buyandsell/customer/getcart/"+uid);
  }).catch((error)=>{console.log(error)})
})

//cancel order:
app.get("/buyandsell/user/cancelorder_request/:pid/:uid", (req,res)=>{
  let {pid, uid}=req.params;
  Order.findOne({_id : pid}).then((order)=>{
    console.log(order);
     res.render("cancelorder.ejs", {pid, uid, activePage:" ", order}

     );}).catch((error)=>{console.log(error)})

 
})
app.post("/buyandsell/user/cancelorder/:pid/:uid", (req,res)=>{
  let cancelReason=req.body.cancel_reason;
  if(!cancelReason) return res.send("Please provide a reason for cancellation");

  let {pid, uid}=req.params;
  Order.findByIdAndUpdate(pid, {status: "Canceled By Customer", cancel_reason: cancelReason}).then((result)=>{
    Order.findById(pid).then((order)=>{
      prodId=order.productId;
      Product.findById(prodId).then((product)=>{
        Product.findByIdAndUpdate(prodId, {stock:product.stock+1, purchase: product.purchase-1}).then((r1)=>{}).catch((e1)=>{})
        
        let notification= new Notification({
          senderId:uid,
          receiverId: product.sellerId,
          message: `Order for your product "${order.ordertitle}" has been canceled by Customer with reason: "${cancelReason}`
        })
        notification.save().then((r)=>{
          User.findByIdAndUpdate(product.sellerId, {isRead: false}).then((u)=>{
            res.redirect("/buyandsell/customer/myorders/"+uid);
          }).catch((e)=>{})
        }).catch((e)=>{})
      }).catch((error2)=>{console.log(error2)})
    }).catch((error1)=>{console.log(error1)})
}).catch((error)=>{console.log(error)})
})

//search
app.post("/buyandsell/search/:uid", (req, res)=>{
  let {uid}= req.params;
  let {searchedProduct}= req.body;
  searchedProduct?res.redirect(`/buyandsell/search/${uid}/${searchedProduct}`):res.redirect(`/buyandsell/search/${uid}/men`);
  
})

app.get("/buyandsell/search/:uid/:searchedProduct", (req,res)=>{
  let {uid, searchedProduct}=req.params;

  User.findById(uid).then((user)=>{
    Product.find({
  $or: [
    { title: { $regex: searchedProduct, $options: 'i' } },
    { tags: { $regex: searchedProduct, $options: 'i' } },
    { description: { $regex: searchedProduct, $options: 'i' } }
  ]
}).then((products)=>{
res.render("search.ejs",{user, products, searchedProduct, activePage:searchedProduct})
}).catch((err)=>{console.log(err)})

  }).catch((error)=>{console.log(error)})
})
//forgot password
app.get("/buyandsell/password_recovery", (req,res)=>{
  res.render("password_recovery.ejs", {activePage:" "});})

  app.post("/buyandsell/password_recovery", (req,res)=>{

  let {femail,fpassword,pname}=req.body;
  User.findOne({email:femail}).then((user)=>{
    if(!user){res.send("User Not Registered")}
    else{
      user.password=fpassword;
      user.save().then((result)=>{res.redirect("/buyandsell/home/"+result._id)}).catch((e)=>{res.send(e.errmsg);console.log(e)})
    }
  }).catch((error)=>{console.log(error); res.send(error)})
});


app.use((req,res)=>{
    Product.find({}).then((products)=>{res.render("homepage.ejs", {products , activePage:"Home"})}).catch((error)=>{console.log(error)})
})
//routes end
app.listen(3000, ()=>{console.log("Server started at 3000");});
