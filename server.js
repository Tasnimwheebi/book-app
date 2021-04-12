'use strict';

require('dotenv').config();



const express = require('express');

const superagent = require('superagent');

const PORT = process.env.PORT || 3000;

const app = express();
app.set('view engine','ejs');
app.use(express.static('./public'));


// Routes:

app.get('/', homeRouteHandler);//home route
app.get('/search', searchHandler);//hello route
app.get('*', notFoundHandler); //error handler



// Routes handlers:

function homeRouteHandler(req, res) {
  res.render('pages/index');
}

function searchHandler (req,res){
  let booksArray = [];
  let ulrChoice;

  let bookName = req.query.book;
  console.log('bookname?',bookName);
  let url = `https://www.googleapis.com/books/v1/volumes?q=${bookName}+intitle`;
  let url2 = `https://www.googleapis.com/books/v1/volumes?q=${bookName}+inauthour`;
  if (req.query.bookChoice === 'title'){ ulrChoice = url;}
  else if(req.query.bookChoice === 'author') {ulrChoice = url2;}
  superagent.get(ulrChoice)
    .then(booksData=>{
      let bData = booksData.body.items;
      bData.forEach (val => {
        let newBook = new Book (val);
        booksArray.push(newBook);
      });
      // res.send(bData);
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
  this.cover = bookData.volumeInfo.imageLinks.thumbnail;
  this.description = bookData.volumeInfo.description;


}
