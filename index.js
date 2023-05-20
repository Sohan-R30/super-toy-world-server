const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const app = express();

const port = process.env.PORT || 2000;

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.fhpe21r.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const superToysCollection = client.db("superToyDB").collection("Toys")


    const indexKeys = {toyName: 1};
    const indexOptions = {name: "ToyName"};

    const result = await superToysCollection.createIndex(indexKeys,indexOptions);

    // route for add a toy

    app.post("/add-toy", async(req, res) => {
        const toy = req.body;
        const result = await superToysCollection.insertOne(toy)
        res.send(result);
    })

    // route for total toys count
    app.get("/totalToys", async(req, res) => {
        const result = await superToysCollection.estimatedDocumentCount();
        const totalToys = {totalToys: result};
        res.send(totalToys)
    })

    // route for get all toys images only
    app.get("/allImages", async(req, res) => {
        const options = {
            projection: { toyPhoto: 1,},
          };
        const result = await superToysCollection.find({},options).toArray();
        res.send(result)
    })

    // route for show all toys for all users

    app.get("/all-toys", async(req, res) => {
        const page = parseInt(req.query.page) || 1 ;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const result = await superToysCollection.find().skip(skip).limit(limit).toArray();
        res.send(result)
    })


    // route for show single toys 

    app.get("/single-toy/:id", async(req, res) => {
        const id = req.params.id;
        const filter = {_id: new ObjectId(id)};
        const result = await superToysCollection.findOne(filter)
        res.send(result)
    })

    // route for show all user toys by search 
    app.get("/searchInAllToys/:text", async(req, res) => {
        const searchText = req.params.text || "";
        const result = await superToysCollection.find({
            $or: [{toyName: {$regex: searchText, $options: "i"}},]
        }).toArray();
        res.send(result)
    })

    // route for show only my posted toys

    app.get("/my-toys", async(req, res) => {
        const email = req.query.email;
        const assenOrdessen = req.query.sortby;
        const sortBy = {};
        if(assenOrdessen === "ascending"){
            sortBy.price = 1;
        }
       if(assenOrdessen === "descending"){
            sortBy.price = -1;
        }
        
        const query = {sellarEmail: {$eq: email}};
        const cursor = superToysCollection.find(query);
        const result = await cursor.sort(sortBy).toArray();
        res.send(result)
    })

    // delete a toy from my posted toys
    app.delete("/delete-toy:id", async(req, res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await superToysCollection.deleteOne(query);
        res.send(result);
    })

    // update my toy from my posted toys

    app.patch("/update-toy/:id", async(req, res) => {
        const id = req.params.id;
        const toy = req.body;
        const filter = {_id: new ObjectId(id)};
        const updateDoc = {
            $set : toy,
        }
        const result = await superToysCollection.updateOne(filter,updateDoc);
        res.send(result)
    })

    // get data by logged user and id

    app.get("/myupdate-toy",async(req,res) => {
        const email = req.query.email;
        const id = req.query.id;
        const filter = {sellarEmail:email, _id: new ObjectId(id)};
        const result = await superToysCollection.findOne(filter);
        res.send(result)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Super toy world is running')
})

app.listen(port, () => {
    console.log(`Super toy world is running on port ${port}`)
  })