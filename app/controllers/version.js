
const{response} = require('express');
const sql = require('../models/connection_models');


const bkversion = async (req, res = response) => {
    var resultaGlobal;
    let body = req.body;
  
    try {

        const veficar_existe =

            sql.query(`SELECT * FROM appversion`, (error, VersionDB) => {
                if (error) { console.error(error) }

                return res.json({
                    ok: false,
                    VersionDB,
                });


            });


    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            msg: 'Hable con el administrador'
        });

    }


}




module.exports = {
    bkversion
}