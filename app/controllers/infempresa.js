
const{response} = require('express');
const sql = require('../models/connection_models');



const bkinfoempresa =  async  (req, res = response) =>{

   
    let body     =   req.body;
    let casa = body.casa
   
  

  try{

      sql.query(`SELECT * FROM ifoempresa  `, (error, InfempresaDB) => {
        if (error) 
        { console.error(error) }

          return res.json({
            ok: true,
            InfempresaDB  
          });  
  
        
      });  
  
   
  } catch(error){
    console.log(error);
    return res.status(500).json({
        ok: false,
        msg: 'Hable con el administrador'
    });
  
  }
  
  
  }


module.exports = {
    bkinfoempresa
}