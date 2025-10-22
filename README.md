# 🛒 Buy & Sell — Multi-Merchant E-Commerce Platform

**Buy & Sell** is a full-stack multi-merchant e-commerce web application that enables multiple sellers to manage and sell their products while offering customers a smooth shopping experience.  
It features secure authentication, real-time notifications, merchant dashboards, and a dynamic shopping cart system — all built with modern web technologies.

---

## 🚀 Features

-  **Multi-Merchant System** — Supports multiple merchants, each with their own dashboard for managing products and orders.  
-  **User Accounts** — Customer registration, login, and profile management.  
-  **Product Browsing & Search** — Search products by category, keyword, or merchant.  
-  **Shopping Cart & Checkout** — Customers can add products to cart, place orders, and view order history.  
-  **Order Management** — Merchants can view, update, and manage received orders.  
-  **Real-Time Notifications** — Email notifications for customers and merchants using **Nodemailer API**.  
-  **Responsive UI** — Fully responsive design powered by **Bootstrap** and **EJS templates**.  
-  **Cloud Deployment** — Hosted on **Render** with **MongoDB Atlas** for database management.  

---

## 🛠️ Tech Stack

| Category | Technologies |
|-----------|--------------|
| **Frontend** | HTML, CSS, Bootstrap, EJS Templates |
| **Backend** | Node.js, Express.js, REST APIs |
| **Database** | MongoDB, MongoDB Atlas |
| **Notifications** | Nodemailer API |
| **Hosting** | Render |
| **Version Control** | Git, GitHub |

---

## ⚙️ Installation & Setup

To run **Buy & Sell** locally on your machine:

```bash
# Clone the repository
git clone https://github.com/ravishankar7488/Buy-And-Sell-Project

# Navigate into the project directory
cd Buy-and-Sell

# Install dependencies
npm install

# Create a .env file in the root directory and add:
# MONGODB_URI=<your-mongodb-atlas-connection-string>
# EMAIL_USER=<your-email-for-nodemailer>
# EMAIL_PASS=<your-email-password-or-app-password>

# Start the server
node index.js
