'use strict';

require('dotenv').config();

const methodOverride = require('method-override');
const express = require('express');

const superagent = require('superagent');

const PORT = process.env.PORT || 3000;
const pg = require('pg');
const app = express();

app.set('view engine','ejs');
app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.put('/updateBook/:id',updateBookHandler);
app.delete('/deletebook/:id',deleteBookHandler);

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DEV_MODE ? false : { rejectUnauthorized: false },
});

// Routes:

app.get('/', homeRouteHandler);//home route
app.post('/search', searchHandler);//hello route
app.get('/searches/new',(req,res)=>{

  res.render('pages/searches/new');
});
app.post('/books',addBookHandler);

// Routes handlers:

function homeRouteHandler(req, res) {
  let SQL = 'select * from books;';
  client.query(SQL)
    .then(result =>{
      // console.log(result);
      res.render('pages/index',{booksArr:result.rows});
    })
    .catch(err=>{
      res.render('pages/error',{error:err});
    });

}

function searchHandler (req,res){
  let booksArray = [];

  let bookChoice = req.body.bookChoice;
  let bookName = req.body.book;
  // console.log('bookname?',req.body);
  let url = `https://www.googleapis.com/books/v1/volumes?q=+in${bookChoice}:${bookName}`;
  superagent.get(url)
    .then(booksData=>{
      console.log(booksData.body);
      let bData = booksData.body.items;
      bData.forEach (val => {
        let newBook = new Book (val);
        booksArray.push(newBook);
      });
      // res.send(booksData.body);
      res.render('pages/searches/show',{booksArr:booksArray});
    });

}

function addBookHandler (req , res){
  // console.log(req.body);
  let {author,title,isbn,image_url,description}=req.body;
  let SQL = 'INSERT INTO books (author,title,isbn,image_url,description) VALUES ($1,$2,$3,$4,$5) RETURNING id;';
  let safeValues =[author,title,isbn,image_url,description];
  client.query(SQL,safeValues)
    .then(result=>{
      res.redirect(`/bookdetails/${result.rows[0].id}`);
    })
    .catch(err=>{
      res.render('pages/error',{error:err});
    });
}

app.get('/bookdetails/:id', (req, res)=>{
  // res.render('pages/books/detail');
  let SQL = 'SELECT * FROM books WHERE id=$1;';
  let safeValues = [req.params.id];
  console.log(req.params.id);
  client.query(SQL,safeValues)
    .then(result =>{
      // console.log(result.rows[0]);
      res.render('pages/books/detail', {detailsShow:result.rows[0]});
    })
    .catch(err=>{
      res.render('pages/error',{error:err});
    });
});

function updateBookHandler(req,res){
  let {author,title,isbn,image_url,description}=req.body;
  let SQL = 'UPDATE books SET author=$1,title=$2,isbn=$3,image_url=$4,description=$5 WHERE id=$6; ';
  let safeValues =[author,title,isbn,image_url,description,req.params.id];
  client.query(SQL,safeValues)
    .then(()=>{
      res.redirect(`/bookdetails/${req.params.id}`);
    });

}

function deleteBookHandler(req,res) {
  let SQL = `DELETE FROM books WHERE id=$1;`;
  let value = [req.params.id];
  client.query(SQL,value)
   .then(res.redirect('/'));
}

function notFoundHandler(req, res) {
  res.render('pages/error');
}

// app.listen(PORT, () => {
//   console.log(`listening on port ${PORT}`);
// });

function Book (bookData){

  this.title = bookData.volumeInfo.title;
  this.author = bookData.volumeInfo.authors;
  // this.date = bookData.volumeInfo.publishedDate;
  this.image_url =( bookData.volumeInfo.imageLinks) ? bookData.volumeInfo.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';
  this.description = bookData.volumeInfo.description;
}
app.get('*', notFoundHandler);
client.connect()
  .then(() => {
    app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));
  });
