const express = require("express");
require("dotenv").config();
const cors = require("cors");
const port = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Corture savant");
});

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.db_user}:${process.env.db_pass}@cluster0.w5hdwnt.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const userCollection = client.db("DesignCraft").collection("users");

    const classCollection = client.db("DesignCraft").collection("allclass");
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      //   console.log(user);
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user exists here.dont add" });
      }

      const result = await userCollection.insertOne(user);
      // console.log("register", result);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, (req, res) => {
  console.log(`port is listening on ${port}`);
});
