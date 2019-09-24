---
title: "Concept illustrations for express.js and axios"
date: 2019-07-24
excerpt: "This note is about an extreme simple exercise of using express.js and axios. The purpose of this exercise is to learn the basic concept of express.js and axios.First, I create a simple express server, and secondly, I use axios to make http call to the server created."
categories:
  - code
tags:
  - javascript
disableKatex: true
---

This note is about an exercise of using `express.js` and `axios`. First, I create a simple express server, and secondly, I use axios to make http call to the server created.

## Express server
The following is the code for our little express server.

```js
// require the express
const express = require('express')
// create a express instance
const app = express()
// specify the port we want to listen to 
const port = 3000
// define a data for illustration purpose
const mydata = {a:1,b:2,c:3}

app.get('/', (req, res)) => res.json(mydata)

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
```

Save the above code to file `myexpress-server.js`. Now if you run `node myexpress-server.js` in your terminal and open `http://localhost:3000` in your browser, you should see the values of `mydata` printed on the screen!. Now we have successfully set up a small express server!

## Use `axios` to make http call
Now we want to acquire our `mydata` from some external place, we can use `axios` to make API call to our express server built and get our `mydata` object. Let's write our axios code,

```js
// require axios
const axios = require('axios')

// define our axios.get function
const getData = async () => {
  try {
    const mydata = await axios.get('http://localhost:3000')
    console.log(mydata.data)
  } catch (error) {
    console.error(error)
  }
}

// call our function
getData()
```

Save the following code to a file named `myaxios.js`. Now if we a) start our express server by doing `node myexpress-server.js` in the terminal, and b) run our axios code in another terminal window using `node myaxios.js`. Whola, you can see the data for our `mydata` object printed on the terminal!.

