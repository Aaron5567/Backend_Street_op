
const e = require('express');
const { response } = require('express');
const sql = require('../models/connection_models');
const db = require('../config/connection');


const bkgraficamensualgasto=  async  (req, res = response) =>{

    let body = req.body;
    let zona = body.zona;
    const tokenRole = req.auth?.role;
    const isAdmin = String(tokenRole).toLowerCase() === 'admin' || String(tokenRole) === '1';

    if (!isAdmin) {
      return res.status(403).json({
        ok: false,
        msg: 'No tiene permisos de administrador'
      });
    }

    if (zona === undefined || zona === null || zona === '') {
      return res.status(400).json({
        ok: false,
        msg: 'El campo zona es obligatorio'
      });
    }
  
 
  try{
      const result = await db.query(
        `SELECT EXTRACT(YEAR FROM fecha)::int AS year,
                EXTRACT(MONTH FROM fecha)::int AS mes,
                SUM(monto) AS monto,
                EXTRACT(MONTH FROM fecha)::numeric(7,1) AS position
         FROM historicogastos
         WHERE idzona = $1
           AND EXTRACT(YEAR FROM fecha) >= EXTRACT(YEAR FROM CURRENT_DATE) - 1
           AND EXTRACT(YEAR FROM fecha) <= EXTRACT(YEAR FROM CURRENT_DATE)
         GROUP BY year, mes, position
         ORDER BY year ASC, mes ASC`,
        [zona]
      );

      return res.json({
        ok: true,
        GraficamensualgastoDB: result.rows
      });
  } catch(error){
    console.log('ERROR EN BKGRAFICAMENSUALGASTO:', error);
    return res.status(500).json({
        ok: false,
        msg: 'Hable con el administrador..',
        error: error.message
    });
  
  }
  
  
  }




  const bkgraficanualgasto=  async  (req, res = response) =>{

    let body = req.body;
    let zona = body.zona;
    const tokenRole = req.auth?.role;
    const isAdmin = String(tokenRole).toLowerCase() === 'admin' || String(tokenRole) === '1';

    if (!isAdmin) {
      return res.status(403).json({
        ok: false,
        msg: 'No tiene permisos de administrador'
      });
    }

    if (zona === undefined || zona === null || zona === '') {
      return res.status(400).json({
        ok: false,
        msg: 'El campo zona es obligatorio'
      });
    }
  
 
  try{
      const result = await db.query(
        `SELECT EXTRACT(YEAR FROM fecha)::int AS year, SUM(monto) AS monto
         FROM historicogastos
         WHERE idzona = $1
           AND EXTRACT(YEAR FROM fecha) >= EXTRACT(YEAR FROM CURRENT_DATE) - 1
           AND EXTRACT(YEAR FROM fecha) <= EXTRACT(YEAR FROM CURRENT_DATE)
         GROUP BY year
         ORDER BY year ASC`,
        [zona]
      );

      return res.json({
        ok: true,
        GraficamensualgastoDB: result.rows
      });
  } catch(error){
    console.log('ERROR EN BKGRAFICANUALGASTO:', error);
    return res.status(500).json({
        ok: false,
        msg: 'Hable con el administrador..',
        error: error.message
    });
  
  }
  
  
  }


  const bkgrafporcpago=  async  (req, res = response) =>{

    let body = req.body;
    let zona = body.zona;
    let casa = body.casa
    const tokenRole = req.auth?.role;
    const isAdmin = String(tokenRole).toLowerCase() === 'admin' || String(tokenRole) === '1';

    if (!isAdmin) {
      return res.status(403).json({
        ok: false,
        msg: 'No tiene permisos de administrador'
      });
    }

    if (zona === undefined || zona === null || zona === '') {
      return res.status(400).json({
        ok: false,
        msg: 'El campo zona es obligatorio'
      });
    }

    if (casa === undefined || casa === null || casa === '') {
      return res.status(400).json({
        ok: false,
        msg: 'El campo casa es obligatorio'
      });
    }
 
  try{
      const result = await db.query(
        `SELECT
           COALESCE(SUM(CASE WHEN a.codtrans IN (2) THEN a.monto * b.saldo ELSE 0 END), 0) AS anualidad,
           COALESCE(SUM(CASE WHEN a.codtrans IN (1, 4) THEN a.monto * b.saldo ELSE 0 END), 0) AS pagos
         FROM transaccion a
         LEFT JOIN codtrans b ON b.id = a.codtrans
         WHERE a.zona = $1
           AND a.idcasa = $2`,
        [zona, Number(casa)]
      );

      return res.json({
        ok: true,
        GrafporcpagoDB: result.rows
      });
  } catch(error){
    console.log('ERROR EN BKGRAFPORCPAGO:', error);
    return res.status(500).json({
        ok: false,
        msg: 'Hable con el administrador..',
        error: error.message
    });
  
  }
  
  
  }


module.exports = {
  bkgrafporcpago,
    bkgraficamensualgasto,
    bkgraficanualgasto
}
