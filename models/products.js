const mongoose=require("mongoose");
const Schema=mongoose.Schema

const productSchema=new Schema({
  title: {type:String, required: true, minLength:2},
  brand: {type:String, required: true, minLength:2},
  description: {type: String, required: true, lowercase: true, trim: true },
  price: {type: Number, required:true, min: 1},
  priceafterdiscount: {type: Number,required:true, min: 0},
  stock: {type: Number, default: 1, min: 1},
  purchase: {type: Number, default: 0},
  imageurl: {type: String, default: "https://images.unsplash.com/photo-1610513320995-1ad4bbf25e55?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"},
  tags: [String],
  sellerId: {type: mongoose.Schema.Types.ObjectId,
    required: true},
  createdAt: {type: Date, default: Date.now}
});
const Product=mongoose.model("Product", productSchema);
module.exports=Product;