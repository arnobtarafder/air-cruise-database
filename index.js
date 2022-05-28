const express = require('express')
const app = express()
const port = process.env.PORT || 8000
var cors = require('cors')
require('dotenv').config()
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId, Admin } = require('mongodb');
// const stripe = require("stripe")(process.env.STRIPE_KEY);



// cors midelware / express midelware
app.use(
    cors({
    //   origin: "https://apar-motors.web.app", 
    })
  );
app.use(express.json())


// mpongodb cluster data


const uri = `mongodb+srv:${process.env.APAR_MOTORS}:${process.env.APAR_KEY}@cluster0.n9qny.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



// verify jwt midelware

const verrifyjwt = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth) {
        return res.status(403).send({ Message: "unathorized access" })
    }
    const token = auth.split(" ")[1]
    jwt.verify(token, process.env.JWT_KEY, function (err, decoded) {
        if (err) {
            return res.status(401).send({ message: "forbidden access" })
        }
        console.log("decoded", decoded);
        req.decoded = decoded
    })

    next()
}



async function run() {

    try {
        // mongodb collection
        await client.connect()
        const usercollection = client.db("customer").collection("users");
        const allproducts = client.db("products").collection("All products");
        const ordersproducts = client.db("Allorder").collection("order");
        const reviewscollection = client.db("Review").collection("Reviews");
        const profiles = client.db("profile").collection("info");


        // all products section wotking below

        // products get api for only admin can see
        app.get('/products', async (req, res) => {
            const myproducts = await allproducts.find().toArray()
            res.send(myproducts)
        })

        // id wise infromation get for checkout page
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;;
            const query = { _id: ObjectId(id) }
            const idwiseonformation = await allproducts.findOne(query)
            res.send(idwiseonformation)
        })

        //   orders store in db
        app.post('/orders', async (req, res) => {
            const orders = req.body;
            console.log(orders)
            const orderget = await ordersproducts.insertOne(orders)
            res.send(orderget)
        })

        // orders get from db email wise user  user wise my order page
        app.get('/orders', verrifyjwt, async (req, res) => {
            const email = req.query.email
            const decoded = req.decoded.email;
            if (email === decoded) {
                const query = { email: email }
                console.log(query);
                const myorders = await ordersproducts.find(query).toArray()
                res.send(myorders)
            }
            else {
                return res.status(403).send({ message: "foirbidden access" })
            }
        })

        // get all order for manage
        app.get('/allorders', async(req, res)=> {
            const allorder = await ordersproducts.find().toArray()
            res.send(allorder)
        } )

    //    add products in db
      app.post('/addproducts' , async(req,res)=> {
          const products = req.body
          console.log(products);
          const addproducts = await allproducts.insertOne(products)
          res.send(addproducts)
      } )

    //  delet products
    app.delete('/products/:id' , async(req,res)=> {
        const id = req.params.id ;
        const filter = {_id: ObjectId(id)}
        const deleted = await allproducts.deleteOne(filter)
        res.send(deleted)
    } )
    
    //  orders products delet
    app.delete('/orderpro/:id' , async(req,res)=>{
        const id = req.params.id;
        console.log(id, "delet orders");
        const filter = {_id: ObjectId(id)}
        const deletorderproduct = await ordersproducts.deleteOne(filter)
        res.send(deletorderproduct)
    } )
  

//    id wise informartion get for payment
      app.get('/payment/:id' , async(req, res)=> {
          const id = req.params.id
          console.log(id);
          const query = {_id : ObjectId(id)}
          const idwiseonformation = await ordersproducts.findOne(query)
          res.send(idwiseonformation)
      } )

    

    //  products update after order
    //   app.get('/available', async(req,res)=> {
    //       const order = req.query.order

    //       const orderdproducts = await ordersproducts.find(query).toArray()

    //       const all = await allproducts.find().toArray()

    //       const query = {order : order}

    //       all.forEach(products => {
    //           const products = orderdproducts.filter(order => order.pname ===  orderdproducts.productname)
    //           const orderquantity = products.map(product => orderquantity)


    //       }
          
    //       res.send(all)
    //   } )



   



        // all user secyion working blow

        //  user collection make heree
        app.put('/users/:email', async (req, res) => {
            const email = req.params.email;
        
            const info = req.body;
            const filter = { email: email }
            const options = { upsert: true};
            const updateDoc = {
                $set: info
            };
            const updateuser = await usercollection.updateOne(filter, updateDoc, options)
            const token = jwt.sign({ email: email }, process.env.JWT_KEY, { expiresIn: '30d' });
            res.send({ updateuser, token })
        })

        //  user collection get fromdb
        app.get('/users', async (req, res) => {
            const users = await usercollection.find().toArray()
            res.send(users)
        })

        // admin make api creation
        // verrifyjwt,
        app.put('/users/admin/:email', verrifyjwt,  async(req, res) => {
            const email = req.params.email;
            console.log(email , "jwt check for admin");
            const requester = req.decoded.email ;
            const adminsrequester = await usercollection.findOne({email : requester})
            if (adminsrequester.role === "admin" ){
                const filter = { email: email}
                const updateDoc = {
                    $set: { role: "admin" }
                }
                const makeuser = await usercollection.updateOne(filter , updateDoc)
                res.send(makeuser)
            }
           else {
               return res.status(403).send({message: "unaucthorized access"})
           }
        })

        // admin privatre route only admin can access this api's route
        app.get('/users/:email', async(req,res)=> {
            const email = req.params.email ;
            console.log(email, "admin check");
            const checkemail = await usercollection.findOne({email : email})
            const aftercheck = checkemail.role === 'admin'
            res.send({admin : aftercheck})
        } )

        // review api make
        app.post('/reviews', async(req,res)=> {
            const reviews = req.body ;
            console.log(reviews, "reviews got from here");
            const reviewcollections = await  reviewscollection.insertOne(reviews)
            res.send(reviewcollections)
        } )

        // get review api from data base
        app.get('/reviews', async(req,res)=> {
            const getreviews = await reviewscollection.find().toArray()
            res.send(getreviews)
        } )
        
        

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
        app.post('/profile' , async(req,res)=> {
            const profile = req.body ;
            const profileinfo = await profiles.insertOne(profile)
            res.send(profileinfo)
        } )

        // get update profile info
        app.get('/profile', async(req,res)=> {
            const email = req.query.email ;
            console.log(email);
            const query = {email: email}
            console.log(query);
            const updateprofile = await profiles.findOne(query)
            res.send(updateprofile)

        } )
       

        



    }




    // catch start from here
    catch {

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
app.get('/', (req, res) => {
    res.send('Hello kecha up logg late hua kew')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})