

const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const app = express();
const config = require('./config/config.js');
// CORS
app.use(cors());

app.use(bodyParser.json()); 

app.use(bodyParser.urlencoded({ extended: true }));

app.use('/streev1/api', require('../app/router/auth'));

//  const PORT = process.env.PORT ;
// console.log(process.env.NODE_ENV);
// console.log(config.PORT);
// console.log(config.usuariodb);
// console.log(config.passdb);
// console.log(config.dba);

  app.listen(config.PORT, () => {
    console.log(`Server is running on port ${process.env.NODE_ENV} -  ${config.PORT}.`);
  });


