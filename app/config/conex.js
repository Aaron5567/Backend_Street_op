//  var mysqlModel = require('mysql-model');

// var MyAppModel = mysqlModel.createConnection({
//     host     : "localhost",
//     user     : "root",
//     password : "",
//     database : "garita",
//   }); 


const config = require('./config');

var MyAppModel = {

  HOST: config.host,
  USER: config.usuariodb,
  PASSWORD: config.passdb,
  DB: config.dba

};

module.exports = MyAppModel; 
