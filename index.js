const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config() 
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

//middleware
//online-group-study
//5kGZE5JJuRrbHeQ5
app.use(cors({
  origin : ['http://localhost:5173']
}));
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kd61vsr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // await client.connect();

    const FeatureCollection = client.db('OnlineGroupStudyAssignment').collection('featureCard');
    const CreateAssignment = client.db('OnlineGroupStudyAssignment').collection('assignment');
    const SubmitAssignment = client.db('OnlineGroupStudyAssignment').collection('submitassignment');

    app.get('/feature',async(req,res) => {
        const cursor = FeatureCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    })
    app.get('/assignment',async(req,res) => {
        const cursor = CreateAssignment.find();
        const result = await cursor.toArray();
        res.send(result);
    })
    app.get('/assignmentDetails',async(req,res) => {
        const cursor = CreateAssignment.find();
        const result = await cursor.toArray();
        res.send(result);
    })

    app.get('/updateAssignment/:id', async(req,res) =>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      const result = await CreateAssignment.findOne(query);
      res.send(result);
  })

    app.get('/myassignment/:email', async(req,res) =>{
      const email = req.body.email;
      const query = {email :  (email)};
      const cursor = CreateAssignment.find(query);
      const result = await cursor.toArray();
      res.send(result);
  })


    app.post('/assignment',async(req,res) => {
      const user = req.body;
      const result = await CreateAssignment.insertOne(user);
      res.send(result);
    })
    app.post('/submitAssignment',async(req,res) => {
      const user = req.body;
      const result = await SubmitAssignment.insertOne(user);
      res.send(result);
    })

    app.put('/updateAssignment/:id', async (req,res) => {
      const id = req.params.id;
      const user = req.body;
      // console.log(id,user);
      const filter = {_id : new ObjectId(id)};
      const options = {upsert : true};
      const updatedSpot = {
          $set : {
            imageurl: user.imageurl,
              title : user.title,
              mark : user.mark,
              inputField : user.inputField,
          }
      };
      const result = await CreateAssignment.updateOne(filter,updatedSpot,options);
      res.send(result);
  })

    app.delete('/deleteassignment/:id', async(req,res) => {
      const id = req.params.id;
      // console.log('delte',id);
      const query = {_id : new ObjectId(id)};
      const result = await CreateAssignment.deleteOne(query);
      res.send(result);
  })


    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/',async(req,res) => {
    res.send('online study web site is running');
})

app.listen(port,() =>{
    console.log(`this server is running : ${port}`)
})