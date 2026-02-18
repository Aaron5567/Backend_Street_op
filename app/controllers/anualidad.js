
const { response } = require('express');
const sql = require('../models/connection_models');


const bkanualidad = async (req, res = response) => {
    var resultaGlobal;
    let body = req.body;
    let zona = body.zona
  
   
    try {

            sql.query(`SELECT a.id  
            FROM casa a
            where a.idcodcalle = '${zona}' `, (error, AnualidadDB) => {
                if (error) { console.error(error) }
                return res.json({
                    ok: false,
                    AnualidadDB
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


const factutraemitida = async (req, res = response) => {
    var resultaGlobal;
    let body   = req.body;
    let zona   = body.zona
    let idcasa = body.idcasa
  
   
    try {

            sql.query(`SELECT  a.fecha, Month(a.fecha) as mes,
            Case  (Month(a.fecha))
            when 1 then 'Enero'
            when 2 then 'Febrero'
            when 3 THEN 'Marzo'
            when 4 THEN 'Abril'
            when 5 THEN 'Mayo'
            when 6 THEN 'Junio'
            when 7 THEN 'Julio'
            when 8 THEN 'Agosto'
            when 9 THEN 'Septiembre'
            when 10 THEN 'Octubre'
            when 11 THEN 'Noviembre'
            when 12 THEN 'Diciembre'
            END mesnombre, b.sector, b.barriada, nombrecalle as calle,  
            c.casa as casa , a.monto, year(a.fecha) as year
            FROM transaccion a 
            left join calle b on b.idcodcalle = a.zona
            left Join casa c on c.id = a.idcasa
            where a.codtrans = 2
            and a.zona = '${zona}' and a.idcasa = '${idcasa}'
            and month(a.fecha)>= month(NOW())-12
            order by a.fecha desc `, 
            (error, facturaemitidaDB) => {
                if (error) { console.error(error) }

                if(facturaemitidaDB == ""){
                    return res.json({
                        ok:false,
                        msg : "Favor enviar los campos necesarios"
                    })
                }
                return res.json({
                    ok: true,
                    facturaemitidaDB
                });
            });

    } catch (error) {
        
        return res.status(500).json({
            ok: false,
            msg: 'Hable con el administrador'
        });

    }


}



module.exports = {
    bkanualidad,
    factutraemitida
}