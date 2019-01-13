const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/exercise-track' )




var Schema = mongoose.Schema
var userSchema = new Schema({
  username : {type: String, requiredd: true},
  excercise: {type: Array}
})/* = <Your Model> */

var Users = mongoose.model('user', userSchema);


app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.post('/api/exercise/new-user', (req, res) => {
  let userName = req.body.username
  let query = Users.find({name: userName})
  query.select(['name'])
  query.exec((err, result) => {
    if (err) console.log(err)
    else {
      if (result.length > 0) {
        res.json({"error": "Username Exists"})
      } else {
        let entry = new Users({name: userName})
        entry.save((err, result) => {
          if (err) console.log("User Creation Error")
          else res.json({"username": result.username, "_id": result._id})
        })
      }
    }
  })
})

app.get('/api/exercise/users', (req, res) => {
  let query = Users.find({}).select(['username', '_id'])
  query.exec((err, match) => {
    if (err) console.log("Error Retriving Users" + err)
    else res.json(match)
  })
})


app.post('/api/exercise/add', (req, res) => {
  console.log(req.body)
  res.json({})
})

app.use(cors())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
