'use strict';

require('dotenv').config();



const express = require('express');

const superagent = require('superagent');

const PORT = process.env.PORT || 3000;

const app = express();
app.set('view engine','ejs');
app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));

// Routes:

app.get('/', homeRouteHandler);//home route
app.post('/search', searchHandler);//hello route
app.get('/searches/new',(req,res)=>{

  res.render('pages/searches/new');
});
app.get('*', notFoundHandler); //error handler



// Routes handlers:


function homeRouteHandler(req, res) {
  res.render('pages/index');
}

function searchHandler (req,res){
  let booksArray = [];

  let bookChoice = req.body.bookChoice;
  let bookName = req.body.book;
  console.log('bookname?',req.body);
  let url = `https://www.googleapis.com/books/v1/volumes?q=+in${bookChoice}:${bookName}`;
  // let url2 = `https://www.googleapis.com/books/v1/volumes?q=${bookName}+inauthour`;
  // if (req.body.bookChoice === 'title'){ ulrChoice = url;}
  // else if(req.body.bookChoice === 'author') {ulrChoice = url2;}
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

function notFoundHandler(req, res) {
  res.render('pages/error');
}

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});

function Book (bookData){

  this.title = bookData.volumeInfo.title;
  this.author = bookData.volumeInfo.authors;
  this.date = bookData.volumeInfo.publishedDate;
  this.cover =( bookData.volumeInfo.imageLinks) ? bookData.volumeInfo.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';
  this.description = bookData.volumeInfo.description;
}
