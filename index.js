const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express()
const port = process.env.PORT || 5000;
require('dotenv').config();

// middle wares
app.use(cors())
app.use(express.json())

// mongodb connection with server

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@powercluster.5gdlqjt.mongodb.net/?retryWrites=true&w=majority`;

console.log(uri);

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

/*............................
verify user by token api
.............................*/
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {

        // database and collection create
        const database = client.db('power');
        const loginCollection = database.collection('login');
        const billCollection = database.collection('bill');
        

        /*..............................
        JWT api token
        ................................*/
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10h' })

            res.send({ token })
        })
        /*...........................
         
        My login data CRUD start
         
        ............................*/

        //login data create and send

        app.post('/login', async (req, res) => {
            const login = req.body;
            const result = await loginCollection.insertOne(login);
            res.send(result);
            console.log(result);
        })


        // login all data view by email

        app.get('/login', verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            if (decoded.email !== req.query.email) {
                return res.status(403).send({ message: 'unauthorized access' })
            }
            let query = {}
            if (req.query.email) {
                query = { email: req.query.email }
            }
            const cursor = loginCollection.find(query)
            const login = await cursor.toArray();
            res.send(login);
        });


        /*...............*/

        // // login single  data view by id ......
        app.get('/login/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const login = await loginCollection.findOne(query)
            res.send(login);
        });

        // login  data update

        app.patch('/login/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const user = req.body;
            const updatemyreview = {
                $set: {
                    reviewer: user.reviewer,
                    phone: user.phone,
                    message: user.message,
                }
            }
            const result = await loginCollection.updateOne(filter, updatemyreview)
            res.send(result)
        })

        //login data delete 
        app.delete('/login/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await loginCollection.deleteOne(query)
            res.send(result)
        })
        /*...........................
         
               My reviewer data CRUD end
               
        ............................*/

        /*....................
        
        My bill data CRUD start
         
        ..........................*/
        //bill all data read and view
        app.get('/bill', async (req, res) => {
            const query = {}
            const cursor = billCollection.find(query)
            const bill = await cursor.toArray();
            res.send(bill);
        })
        // limit 3 data read and view
        app.get('/bill3', async (req, res) => {
            const query = {}
            const cursor = billCollection.find(query)
            const service = await cursor.limit(10).toArray();
            res.send(service);
        })

        //single data read with id and view
        app.get('/bill/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await billCollection.findOne(query)
            res.send(result)
        })
        //single 3 data read with id and view
        app.get('/bill3/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await billCollection.findOne(query)
            res.send(result)
        })

       
        /*....................
         
         My bill data CRUD end
                
        ..........................*/
       
    }
    finally {
        // console.log('final')
    }
}
run().catch(err => console.error(err))

// data read test
// app.get('/bill', (req, res) => {
//     res.send(bill);
// })
app.get('/', (req, res) => {
    res.send('server-mongo-connect running')
})
app.listen(port, (req, res) => {
    console.log(`power hacker server mongo connect port ${port}`)
})