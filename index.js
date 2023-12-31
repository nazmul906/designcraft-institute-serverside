const express = require("express");
require("dotenv").config();
const cors = require("cors");
const port = process.env.PORT || 5000;
const app = express();
const jwt = require("jsonwebtoken");

app.use(cors());
app.use(express.json());

const verifyJwt = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: "unathorized token" });
  }

  const token = authorization.split(" ")[1];

  // now verify
  jwt.verify(token, process.env.SecretAccessToken, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unathorized token" });
    }
    req.decoded = decoded;
    next();
  });
};

app.get("/", (req, res) => {
  res.send("Corture savant");
});

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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

    // jwt
    app.post("/jwt", (req, res) => {
      const user = req.body;

      const jwtToken = jwt.sign(user, process.env.SecretAccessToken, {
        expiresIn: "8hr",
      });
      res.send({ jwtToken });
    });

    // make admin by manual admin
    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;

      //   console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };

      const result = await userCollection.updateOne(filter, updateDoc);

      res.send(result);
    });

    //  registration
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

    // admin dashboard
    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    // verify admin for dashboard
    app.get("/users/admin/:email", verifyJwt, async (req, res) => {
      const adminEmail = req.params.email;

      if (adminEmail !== req.decoded.email) {
        res.send({ admin: false });
      }

      const query = { email: adminEmail };
      const user = await userCollection.findOne(query);
      // console.log("user", user);
      // if user exist then match his role
      const result = { admin: user?.role === "admin" };
      res.send(result);
    });

    // for useInstructor hook
    app.get("/users/instructor/:email", verifyJwt, async (req, res) => {
      const instructorEmail = req.params.email;
      // console.log("instructorEmail", instructorEmail);
      if (instructorEmail !== req.decoded.email) {
        res.send({ instructor: false });
      }
      const query = { email: instructorEmail };
      const user = await userCollection.findOne(query);
      // console.log(user);
      const result = { instructor: user?.role === "instructor" };
      // response is {instructor:true}
      res.send(result);
    });
    // instructor add class
    app.post("/addclass", async (req, res) => {
      const item = req.body;

      const result = await classCollection.insertOne(item);
      console.log(result);
      res.send(result);
    });

    // ins get class
    app.get("/myclass", async (req, res) => {
      // const userEmail = req.params.email;
      const { email } = req.query;
      // console.log("email", email);

      let query = {};
      if (req.query?.email) {
        query = { instructorEmail: req.query.email };
      }

      // const query = { email: email };
      const result = await classCollection.find(query).toArray();
      // console.log(result);
      res.send(result);
    });

    // approved class
    app.patch("/approve/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };

      const updateDoc = {
        $set: {
          status: "approved",
        },
      };
      const result = await classCollection.updateOne(filter, updateDoc);
      // console.log("update", result);
      res.send(result);
    });

    // display approve class
    app.get("/approveclass", async (req, res) => {
      const query = { status: "approved" };
      const result = await classCollection.find(query).toArray();
      //   console.log(result);
      res.send(result);
    });

    // deny by admin
    app.patch("/myclass/deny/:id", async (req, res) => {
      const id = req.params.id;
      // find the item
      const filter = { _id: new ObjectId(id) };
      // update it
      const updateDoc = {
        $set: {
          status: "denied by admin",
        },
      };
      const result = await classCollection.updateOne(filter, updateDoc);
      // console.log("denied", result);
      res.send(result);
    });

    // send feedback by admin
    app.put("/myclass/feedback/:id", async (req, res) => {
      const id = req.params.id;
      const { feedback } = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          feedback: feedback,
        },
      };
      const result = await classCollection.updateOne(filter, updateDoc);
      // console.log("updated", result);
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
