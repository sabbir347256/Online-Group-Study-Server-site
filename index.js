const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const stripe = require('stripe')(process.env.SECRET_KEY)
const express = require('express');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

//middleware
//online-group-study
//5kGZE5JJuRrbHeQ5
app.use(cors({
  origin: ['http://localhost:5173', 'https://online-group-study-67ed0.web.app', 'https://online-group-study-67ed0.firebaseapp.com'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kd61vsr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const logger = (req, res, next) => {
  console.log('log : info', req.method, req.url);
  next();
}

const tokenVerify = (req, res, next) => {
  const token = req?.cookies?.token;
  // console.log('token in the middleware',token);

  if (!token) {
    return res.status(401).send({ message: 'unauthorized access' })
  }
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'unauthorized access' })
    }
    req.user = decoded;
    next();
  })

}

const cookieOption = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const FeatureCollection = client.db('OnlineGroupStudyAssignment').collection('featureCard');
    const CreateAssignment = client.db('OnlineGroupStudyAssignment').collection('assignment');
    const SubmitAssignment = client.db('OnlineGroupStudyAssignment').collection('submitassignment');

    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '365d' })

      res.cookie('token', token, cookieOption)
        .send({ Success: true })
    })

    app.post('/logout', async (req, res) => {
      const user = req.body;
      res.clearCookie('token', { ...cookieOption, maxAge: 0 }).send({ Success: true })
    })

    app.get('/feature', async (req, res) => {
      const cursor = FeatureCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })
    app.get('/assignment', async (req, res) => {
      const cursor = CreateAssignment.find();
      const result = await cursor.toArray();
      res.send(result);
    })
    app.get('/submitAssignment', logger, tokenVerify, async (req, res) => {
      if (req.user.email !== req.query.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      const cursor = SubmitAssignment.find();
      const result = await cursor.toArray();
      res.send(result);
    })
    app.get('/submitAssignment/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      // const cursor = SubmitAssignment.find(query);
      const result = await SubmitAssignment.findOne(query);
      res.send(result);
    })
    app.get('/assignmentDetails', async (req, res) => {
      const cursor = CreateAssignment.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/updateAssignment/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await CreateAssignment.findOne(query);
      res.send(result);
    })

    app.get('/myassignment', logger, tokenVerify, async (req, res) => {
      if (req.user.email !== req.query.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      const cursor = SubmitAssignment.find();
      const result = await cursor.toArray();
      res.send(result);
    })
    app.get('/myassignment/:email', async (req, res) => {
      const email = req.body.email;
      const query = { email: (email) };
      const cursor = SubmitAssignment.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })


    app.post('/assignment', async (req, res) => {
      const user = req.body;
      const result = await CreateAssignment.insertOne(user);
      res.send(result);
    })
    app.post('/submitAssignment', async (req, res) => {
      const user = req.body;
      const result = await SubmitAssignment.insertOne(user);
      res.send(result);
    })

    app.put('/updateAssignment/:id', async (req, res) => {
      const id = req.params.id;
      const user = req.body;
      // console.log(id,user);
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedSpot = {
        $set: {
          imageurl: user.imageurl,
          title: user.title,
          mark: user.mark,
          inputField: user.inputField,
        }
      };
      const result = await CreateAssignment.updateOne(filter, updatedSpot, options);
      res.send(result);
    })
    app.put('/updateMark/:id', async (req, res) => {
      const id = req.params.id;
      const user = req.body;
      // console.log(id,user);
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedSpot = {
        $set: {
          num: user.mark,
          feedback: user.feedback
        }
      };
      const result = await SubmitAssignment.updateOne(filter, updatedSpot, options);
      res.send(result);
    })

    app.delete('/deleteassignment/:id', async (req, res) => {
      const id = req.params.id;
      // console.log('delte',id);
      const query = { _id: new ObjectId(id) };
      const result = await CreateAssignment.deleteOne(query);
      res.send(result);
    })

    app.post('/create-payment', async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);

      const paymentIntent = await stripe.paymentIntent.create({
        amount: amount,
        currency: 'usd',
        payment_method_types : ['card']
      });

      res.send({
        clientSecret : paymentIntent.client_secret
      })

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



app.get('/', async (req, res) => {
  res.send('online study web site is running');
})

app.listen(port, () => {
  console.log(`this server is running : ${port}`)
})