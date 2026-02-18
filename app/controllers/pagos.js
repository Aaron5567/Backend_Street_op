
const{response} = require('express');
const sql = require('../models/connection_models');



const bkhistoricopagos =  async  (req, res = response) =>{

    var resultaGlobal;
  
    let body     =   req.body;
    let casa = body.casa
   
  

  try{
  
    const veficar_existe =  

      sql.query(`SELECT * FROM pagos where casa = '${casa}' `, (error, PagosDB) => {
        if (error) 
        { console.error(error) }
  
  
       
          return res.json({
            ok: false,
            PagosDB  
          
           
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
    bkhistoricopagos
}