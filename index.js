const { MongoClient, ServerApiVersion, ObjectId, Admin } = require('mongodb');
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = process.env.PORT || 5000;

//middleware

// cors midelware / express midelware
app.use(
    cors()
  );
app.use(express.json())



const verifyJWT = (req, res, next) => {
    const auth = req?.headers?.authorization;
    if (!auth) {
        return res.status(403).send({ Message: "unathorized access" })
    }
    const token = auth.split(" ")[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(401).send({ message: "forbidden access" })
        }
        req.decoded = decoded
        console.log("decoded", decoded);
    })

    next()
}




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.otcue.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1
});


async function run() {

    try {
        // mongodb collection
        await client.connect()
        // const allproducts = client.db("products").collection("All products");
        // const orderCollection = client.db("Allorder").collection("order");
        // const usercollection = client.db("customer").collection("users");
        // const reviewCollection = client.db("Review").collection("Reviews");
        // const profiles = client.db("profile").collection("info");

        const productCollection = client.db("air_cruise").collection("products");
        const orderCollection = client.db("air_cruise").collection("orders");
        const userCollection = client.db("air_cruise").collection("users");
        const reviewCollection = client.db("air_cruise").collection("reviews");
        const paymentCollection = client.db("air_cruise").collection("payments");
        const profiles = client.db("air_cruise").collection("information");



        const verifyAdmin = async (req, res, next) => {
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({ email: requester });
            if (requesterAccount.role === "admin") {
                next();
            }
            else {
                return res.status(403).send({ message: 'Forbidden access' })
            }
        }


        // all products section working below

        // products get api for only admin can see
        app.get('/products', async (req, res) => {
            const products = await productCollection.find().toArray()
            res.send(products)
        })

        // id wise information get for checkout page
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;;
            const query = { _id: ObjectId(id) }
            const idWiseInformation = await productCollection.findOne(query)
            res.send(idWiseInformation)
        })

        // orders store in db
        app.post('/orders', async (req, res) => {
            const orders = req.body;
            console.log(orders)
            const order = await orderCollection.insertOne(orders)
            res.send(order)
        })

        // orders get from db email wise user  user wise my order page
        app.get("/orders", async (req, res) => {
            const patient = req?.query?.email;
            console.log(patient);
            const decodedEmail = "air-cruise@gmail.com";
            console.log(decodedEmail);
            if (patient === decodedEmail) {
                const query = { patient: patient };
                const bookings = await orderCollection.find(query).toArray();
                return res.send(bookings);
            }
            else {
                return res.status(403).send({ message: 'forbidden access' });
            }

        })

        app.patch("/orders/:id", async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const filter = { _id: ObjectId(id) };
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }

            const updatedOrder = await orderCollection.updateOne(filter, updatedDoc)
            const result = await paymentCollection.insertOne(payment)
            res.send(result)
        })

        // get all order for manage
        app.get('/allOrders', async (req, res) => {
            const allOrder = await orderCollection.find().toArray()
            res.send(allOrder)
        })

        //----------------PAYMENT
        app.post('/create-payment-intent', async (req, res) => {
            const product = req.body;
            const price = product.price;
            const amount = price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            });
            res.send({ clientSecret: paymentIntent.client_secret })
        });


        //    add products in db
        app.post('/addProduct', async (req, res) => {
            const products = req.body
            console.log(products);
            const addProduct = await productCollection.insertOne(products)
            res.send(addProduct)
        })

        //  delete products
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const deleted = await productCollection.deleteOne(filter)
            res.send(deleted)
        })

        //  orders products delete
        app.delete('/orderpro/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id, "delete orders");
            const filter = { _id: ObjectId(id) }
            const deleteOrderProduct = await orderCollection.deleteOne(filter)
            res.send(deleteOrderProduct)
        })


        //    id wise information get for payment
        app.get('/payment/:id', async (req, res) => {
            const id = req.params.id
            console.log(id);
            const query = { _id: ObjectId(id) }
            const idWiseInformation = await orderCollection.findOne(query)
            res.send(idWiseInformation)
        })



        //  products update after order
        //   app.get('/available', async(req,res)=> {
        //       const order = req.query.order

        //       const orderedProducts = await orderCollection.find(query).toArray()

        //       const all = await productCollection.find().toArray()

        //       const query = {order : order}

        //       all.forEach(products => {
        //           const products = orderedProducts.filter(order => order.pname ===  orderedProducts.productName)
        //           const orderQuantity = products.map(product => orderQ quantity)


        //       }

        //       res.send(all)
        //   } )







        // all user section working blow

        //  user collection make here
        app.put('/users/:email', async (req, res) => {
            const email = req.params.email;

            const info = req.body;
            const filter = { email: email }
            const options = { upsert: true };
            const updateDoc = {
                $set: info
            };
            const updateUser = await userCollection.updateOne(filter, updateDoc, options)
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30d' });
            res.send({ updateUser, token })
        })

        //  user collection get fromdb
        app.get('/users', verifyJWT, async (req, res) => {
            const users = await userCollection.find().toArray()
            res.send(users)
        })

        app.delete('/users/:email', async(req, res) => {
            const email = req.params.email;
            const filter = { email: ObjectId(email) };
            const result = await userCollection.deleteOne(filter);
            res.send(result)
        });




        // admin make api creation
        // verifyJWT,
       
        app.put("/users/admin/:email", verifyJWT, verifyAdmin, async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const updateDoc = {
                $set: { role: "admin" },
            }
            const result = await userCollection.updateOne(filter, updateDoc);

            res.send(result);
        })

        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user?.role === 'admin';
            res.send({ admin: isAdmin });
        })

        // admin private route only admin can access this api's route
        app.get('/users/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            console.log(email, "admin check");
            const checkEmail = await userCollection.findOne({ email: email })
            const afterCheck = checkEmail.role === 'admin'
            res.send({ admin: afterCheck })
        })





        // review api make
        app.post('/reviews', async (req, res) => {
            const reviews = req.body;
            console.log(reviews, "reviews got from here");
            const reviewCollections = await reviewCollection.insertOne(reviews)
            res.send(reviewCollections)
        })

        // get review api from data base
        app.get('/reviews', async (req, res) => {
            const getReviews = await reviewCollection.find().toArray()
            res.send(getReviews)
        })



        // // payment information
        // app.post("/create-payment-intent", async (req, res)=> {
        //     const price = req.body ;
        //     const amounts = price.price;
        //     console.log(amounts)
        //     // const prices = {price: price.price}
        //     const amount = amounts*100 ;
        //     console.log(amount);
        //     const paymentIntent = await stripe.paymentIntents.create({
        //       amount: amount,
        //       currency: 'usd',
        //       payment_method_types: ['card']     
        //     });
        //     res.send({clientSecret: paymentIntent.client_secret});
        //   })




        //  profile update
        app.post('/profile', async (req, res) => {
            const profile = req.body;
            const profileInfo = await profiles.insertOne(profile)
            res.send(profileInfo)
        })

        // get update profile info
        app.get('/profile', async (req, res) => {
            const email = req.query.email;
            console.log(email);
            const query = { email: email }
            console.log(query);
            const updateProfile = await profiles.findOne(query)
            res.send(updateProfile)

        })



        console.log("connected to database");


    }




    // catch start from here
    finally {

    }
}

run().catch(console.dir);




// mpongo db collection test
// client.connect(err => {
//   const collection = client.db("test").collection("devices");
//   // perform actions on the collection object
//   console.log("connect from here");
//   client.close();
// });





// express ap hello world

app.get("/", (req, res) => {
    res.send("Hello! I Am Mr.Developer From Air-Cruise Corporation")
})

app.listen(port, () => {
    console.log(`listening to the port: ${port}`);
})