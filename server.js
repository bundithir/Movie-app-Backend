const express = require('express')
const app = express()
const port = 1234
const bcrypt = require('bcryptjs');
const cors = require('cors');
const db = require('knex')({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      port : 5432,
      user : 'postgres',
      password : '123456',
      database : 'movie-app'
    }
  });


app.use(express.json())
app.use(cors())

app.post('/signin',(req,res) => {
    const {name , pass} = req.body;
    if(!name || !pass){
        return res.status(400).json("error");
    }
    db.select('hash','name')
        .from('login')
        .where({
            name : name
        })
        .then(data =>{
            return bcrypt.compare(pass, data[0].hash)
        })
        .then(Verify => {
            if(Verify){
                db.select('*')
                    .from('users')
                    .where({
                        name : name
                    })
                    .then(user => res.json(user[0]))
            }else{
                res.status(400).json('error')
            }
        })
        .catch(err => res.status(400).json('error'))
})

app.get('/',(req,res)=> res.json("It's work"));

app.post('/register',(req,res)=>{
    const {name,pass,email} = req.body;
    if(!pass || !email || !name){
        return res.status(400).json("error");
    }
    bcrypt.hash(pass,10)
    .then(hash => {
        db.transaction(trx => {
            trx.insert({
                hash : hash,
                name : name
            })
            .into('login')
            .returning('name')
            .then(nameLogin =>{
                trx('users')
                .insert({
                    name : nameLogin[0].name,
                    email : email,
                    joined : new Date()
                })
                .returning('*')
                .then(user => res.json(user[0]))
            })
            .then(trx.commit)
            .catch(trx.rollback)
        })
        .catch(err => res.status(400).json('error'))
    })
    .catch(err => res.status(400).json('error'))

})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
