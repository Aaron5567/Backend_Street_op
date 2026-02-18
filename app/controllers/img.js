

const {response} = require('express');
const sql = require('../models/connection_models'); 



const getbanner =  async  (req, res = response) =>{

    sql.query(` SELECT * FROM banner`
    ,(err, banner) =>{
      if(err){
        return res.status(500).json({
          ok:false,
          err 
        });
      } 

      res.json({
          ok: true,
          banner
      })
    
    
    })

}

module.exports= {
    getbanner
}