// const { MongoClient, ServerApiVersion } = require('mongodb');
// require("dotenv").config();
// const express = require('express');
// const cors = require('cors');
// const jwt = require('jsonwebtoken');
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);



// const app = express();
// const port = process.env.PORT || 5000;

// //middleware
// app.use(cors());
// app.use(express.json())


// function verifyJWT(req, res, next) {
//     const authHeader = req.headers.authorization;
//     if (!authHeader) {
//         return res.status(401).send({ message: 'Unauthorized access' });
//     }
//     const token = authHeader.split(' ')[1];
//     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
//         if (err) {
//             return res.status(403).send({ message: 'Forbidden access' })
//         }
//         req.decoded = decoded;
//         next();
//     });
// }



// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.otcue.mongodb.net/?retryWrites=true&w=majority`;
// const client = new MongoClient(uri, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     serverApi: ServerApiVersion.v1
// });


// async function run() {
//     try {
//         await client.connect()
//         const productCollection = client.db("air_cruise").collection("products");
//         const orderCollection = client.db("air_cruise").collection("orders");
//         const userCollection = client.db("air_cruise").collection("users");
//         const reviewCollection = client.db("air_cruise").collection("reviews");
//         const paymentCollection = client.db("air_cruise").collection("payments");


//         const verifyAdmin = async (req, res, next) => {
//             const requester = req.decoded.email;
//             const requesterAccount = await userCollection.findOne({ email: requester });
//             if (requesterAccount.role === "admin") {
//                 next();
//             }
//             else {
//                 return res.status(403).send({ message: 'Forbidden access' })
//             }
//         }


//         //----------PRODUCTS
//         app.get("/products", async (req, res) => {
//             const products = await productCollection.find({}).toArray();
//             res.send(products);
//         })

//          //----------------PRODUCTS
//          app.post('/products', async (req, res) => {
//             const product = req.body;
//             const result = await productCollection.insertOne(product);
//             res.send(result);
//         })



//         //----------USERS        
//         app.get("/users", async (req, res) => {
//             const users = await userCollection.find().toArray();
//             res.send(users)
//         });

//         app.put("/users/:email", async (req, res) => {
//             const email = req.params.email;
//             const user = req.body;
//             const filter = { email: email };
//             const options = { upsert: true };
//             const updateDoc = {
//                 $set: user,
//             }
//             const result = await userCollection.updateOne(filter, updateDoc, options);
//             const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })

//             res.send({ result, token });
//         })

//         app.delete("/users/admin/:email", verifyJWT, verifyAdmin, async (req, res) => {
//             const email = req.params.email;
//             const filter = { email: email }
//             const result = await userCollection.deleteOne(filter);
//             res.send(result);
//         })


//         //---------------ADMIN      
//         app.get('/admin/:email', async (req, res) => {
//             const email = req.params.email;
//             const user = await userCollection.findOne({ email: email });
//             const isAdmin = user?.role === 'admin';
//             res.send({ admin: isAdmin });
//         })

//         app.put("/users/admin/:email", async (req, res) => {
//             const email = req.params.email;
//             const filter = { email: email };
//             const updateDoc = {
//                 $set: { role: "admin" },
//             }
//             const result = await userCollection.updateOne(filter, updateDoc);

//             res.send(result);
//         })

       


//         //-----------ORDERS  
//         app.get("/orders", async (req, res) => {
//             const user = req?.query?.user;
//             const query = { user: user };
//             const orders = await orderCollection.find(query).toArray();
//             res.send(orders)

//         })

//         app.get("/orders/:id", verifyJWT, async (req, res) => {
//             const id = req.params.id;
//             const query = { _id: ObjectId(id) };
//             const booking = await orderCollection.findOne(query);
//             res.send(booking)
//         })

//         app.post('/orders', async (req, res) => {
//             const booking = req.body;
//             const query = { treatment: booking.treatment, date: booking.date, patient: booking.patient }
//             const exists = await orderCollection.findOne(query);
//             if (exists) {
//                 return res.send({ success: false, booking: exists })
//             }
//             const result = await orderCollection.insertOne(booking);
//             return res.send({ success: true, result });
//         })

//         app.patch("/orders/:id", verifyJWT, async (req, res) => {
//             const id = req.params.id;
//             const payment = req.body;
//             const filter = { _id: ObjectId(id) };
//             const updatedDoc = {
//                 $set: {
//                     paid: true,
//                     transactionId: payment.transactionId
//                 }
//             }

//             const updatedOrder = await orderCollection.updateOne(filter, updatedDoc)
//             const result = await paymentCollection.insertOne(payment)
//             res.send(result)
//         })



//         //----------------PAYMENT
//         app.post('/create-payment-intent', verifyJWT, async (req, res) => {
//             const product = req.body;
//             const price = product.price;
//             const amount = price * 100;
//             const paymentIntent = await stripe.paymentIntents.create({
//                 amount: amount,
//                 currency: 'usd',
//                 payment_method_types: ['card']
//             });
//             res.send({ clientSecret: paymentIntent.client_secret })
//         });


//         //----------------REVIEWS
//         app.post('/reviews', async (req, res) => {
//             const booking = req.body;
//             const result = await reviewCollection.insertOne(booking);
//             res.send(result);
//         })
        
       




//         console.log("connected to database");
//     }

//     finally {

//     }
// }

// run().catch(console.dir)




// app.get("/", (req, res) => {
//     res.send("Hello! I Am Mr.Developer From Air-Cruise Corporation")
// })

// app.listen(port, () => {
//     console.log(`listening to the port: ${port}`);
// })