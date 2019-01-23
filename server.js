const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/exercise-track' )




var Schema = mongoose.Schema
var userSchema = new Schema({
  ame : {type: String, requiredd: true},
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
  let query = Users.find({}).select(['name', '_id'])
  query.exec((err, match) => {
    if (err) console.log("Error Retriving Users" + err)
    else res.json(match)
  })
})


app.post('/api/exercise/add', (req, res) => {
  if (req.body.userId == '' || req.body.description == '' || req.body.duration == '') {
    res.json({"error": "Insufficient Data"})
  } else {
    let date
    if (req.body.date == '') {
      date = new Date()
    } else {
      date = new Date(req.body.date)
    }
    if (isNaN(date.getTime())) {
      console.log(date.getTime())
      res.json({"error": "Insufficient Data {Date}"})
    } else {
      Users.findById(req.body.userId, (err, match) => {
      if (err) return console.log(err)
      // console.log(match)
      match.excercise.push({description: req.body.description, duration: req.body.duration, date: date.getTime()})
      match.save((err, data) => {
        if (err) console.log(err)
        else res.json(data)
      })
      // return done(null, match)
    })
    }
  }
})

app.get('/api/exercise/log', (req, res) => {
  console.log(Object.keys(req.query).length)
  if (Object.keys(req.query).length == 0) {
    let query = Users.find({},['_id', 'name', 'excercise'], (err, matchArray) => {
    if (err) console.log(err)
    else {
      res.json(matchArray)
    }
  })
  } else if (Object.keys(req.query).length == 1 && req.query.hasOwnProperty('userId') && req.query.userId != '') {
    Users.findById(req.query.userId, ['_id', 'name', 'excercise'],(err, match) => {
      if (err) console.log(err)
      else {
        // console.log(req.query.userId + " " + match)
        res.json(match)
      }
    })
  } else {
    Users.findById(req.query.userId, ['_id', 'name', 'excercise'], (err, match) => {
      let sortedArr = []
      match.excercise.forEach((m) => {
        if (m.date >= new Date(req.query.from).getTime() && m.date <= new Date(req.query.to).getTime()) {
          sortedArr.push(m)
        }
      })
      res.json({_id: match._id, username: match.name, excercise: sortedArr.slice(0, req.query.limit)})
    })
  }
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
