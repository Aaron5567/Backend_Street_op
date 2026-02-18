
const { response } = require('express');
const sql = require('../models/connection_models');
const db = require('../config/connection');

const bkinsertransanualidad = async (req, res = response) => {
    
    var resultaGlobal;

    let body = req.body;
    let zona = body.zona
    let casa = body.casa
    let prueba  = JSON.parse([casa]);
    let monto = body.monto
    let fecha = body.fecha
    let idadmin = body.idadmin
    let codtrans = 2;
    let detalle = 'Anualidad';

   
    
    try {
  
       for(var  i = 0 ; i < prueba.length ; i ++ ){
            var arreglo = prueba[i];
        
         
            sql.query(`
            INSERT INTO transaccion
            (id, zona, idadmin, fecha, monto, codtrans, detalle, idcasa)
            VALUES ( ${null} ,'${zona}','${idadmin}','${fecha}',${monto},'${codtrans}','${detalle}','${arreglo['id']}')
            `, (error, GastosOPhistoricoDB) => {
                if (error) { console.error(error) }
            });
        }

        return res.json({
            ok: true,
          //  GastosOPhistoricoDB,
        }); 


    } 
    catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            msg: 'Hable con el administrador'
        });

    }


}


const bkinsertranscuota = async (req, res = response) => {
    let body = req.body;
    let zona = body.zona;
    let idcasa = body.idcasa;
    let monto = body.monto;
    let fecha = body.fecha;
    let idadmin = body.idadmin;
    let codtrans = body.codtrans;
    let detalle = body.detalle;

    const tokenRole = req.auth?.role;
    const tokenUserId = req.auth?.id;
    const isAdmin = String(tokenRole).toLowerCase() === 'admin' || String(tokenRole) === '1';
 



    if (!isAdmin) {
      return res.status(403).json({
        ok: false,
        msg: 'No tiene permisos de administrador'
      });
    }

    if (!tokenUserId || Number(idadmin) !== Number(tokenUserId)) {
      return res.status(403).json({
        ok: false,
        msg: 'El idadmin no coincide con el usuario autenticado'
      });
    }
  


    try {
      const insertSql = `INSERT INTO transaccion
          (zona, idadmin, fecha, monto, codtrans, detalle, idcasa)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`;
      const insertParams = [zona, idadmin, fecha, monto, codtrans, detalle, idcasa];

      let result;
      try {
        result = await db.query(insertSql, insertParams);
      } catch (error) {
        // Si la secuencia del id quedó atrás por migración/importación,
        // la sincronizamos con el máximo id actual y reintentamos una vez.
        if (error.code === '23505' && error.constraint === 'transaccion_pkey') {
          await db.query(
            `SELECT setval(
              pg_get_serial_sequence('public.transaccion', 'id'),
              COALESCE((SELECT MAX(id) FROM public.transaccion), 0) + 1,
              false
            )`
          );
          result = await db.query(insertSql, insertParams);
        } else {
          throw error;
        }
      }

       if (result.rowCount > 0) {
        return res.json({
          ok: true,
          msg: 'Se registro correctamente'
        });

      }
      
      return res.json({
        ok: false,
        msg: 'No se registro la información'
      });
    } catch (error) {
      console.log('ERROR EN BKINSERTRANSCUOTA:', error);
      return res.status(500).json({
        ok: false,
        msg: 'Error al registrar el Pago',
        error: error.message
      });
    }
}

const bkfiltropago = async (req, res = response) => {

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

  try {
    const filtroSql = `SELECT year
       FROM (
         SELECT DISTINCT EXTRACT(YEAR FROM a.fecha)::int::text AS year,
                EXTRACT(YEAR FROM a.fecha)::int AS sort_order
         FROM transaccion a
         WHERE a.zona = $1
           AND a.codtrans <> 2

         UNION ALL
         SELECT 'Últimos 3 mese' AS year, 100000 AS sort_order

         UNION ALL
         SELECT 'Últimos 30 días' AS year, 99999 AS sort_order
       ) x
       ORDER BY sort_order DESC`;
    const filtroParams = [zona];
    const result = await db.query(filtroSql, filtroParams);

    if (!result.rows || result.rows.length === 0) {
      return res.json({
        ok: false,
        msg: 'No hay registros'
      });
    }

    return res.json({
      ok: true,
      FiltroDbPago: result.rows
    });
  } catch (error) {
    console.log('ERROR EN BKFILTROPAGO:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Hable con el administrador..',
      error: error.message
    });
  }

 
}

const bkhistoricotranspagos =  async  (req, res = response) =>{

    let body = req.body;
    let casa = body.casa;
    let zona = body.zona;
    let filtro = body.filtro;
    const tokenRole = req.auth?.role;
    const isAdmin = String(tokenRole).toLowerCase() === 'admin' || String(tokenRole) === '1';

    if (!isAdmin) {
      return res.status(403).json({
        ok: false,
        msg: 'No tiene permisos de administrador'
      });
    }

    if (zona === undefined || zona === null || zona === '' ||
        casa === undefined || casa === null || casa === '' ||
        !filtro) {
      return res.status(400).json({
        ok: false,
        msg: 'Faltan campos obligatorios'
      });
    }

    let dateFilterSql = '';
    const params = [Number(casa), zona];

    if (filtro === 'Últimos 3 mese') {
      dateFilterSql = `AND a.fecha >= (CURRENT_DATE - INTERVAL '3 months')`;
    } else if (filtro === 'Últimos 30 días') {
      dateFilterSql = `AND a.fecha BETWEEN (CURRENT_DATE - INTERVAL '30 days') AND CURRENT_DATE`;
    } else {
      const year = Number(filtro);
      if (!Number.isInteger(year) || year < 1900 || year > 3000) {
        return res.status(400).json({
          ok: false,
          msg: 'El filtro debe ser un año válido o un rango permitido'
        });
      }
      params.push(year);
      dateFilterSql = `AND EXTRACT(YEAR FROM a.fecha) = $3`;
    }

  try{
      const result = await db.query(
        `SELECT a.id, a.zona, a.idadmin, a.fecha, a.monto, a.codtrans,
                a.detalle, a.idcasa, b.descripcion,
                EXTRACT(MONTH FROM a.fecha)::int AS mes,
                CASE EXTRACT(MONTH FROM a.fecha)::int
                  WHEN 1 THEN 'Enero'
                  WHEN 2 THEN 'Febrero'
                  WHEN 3 THEN 'Marzo'
                  WHEN 4 THEN 'Abril'
                  WHEN 5 THEN 'Mayo'
                  WHEN 6 THEN 'Junio'
                  WHEN 7 THEN 'Julio'
                  WHEN 8 THEN 'Agosto'
                  WHEN 9 THEN 'Septiembre'
                  WHEN 10 THEN 'Octubre'
                  WHEN 11 THEN 'Noviembre'
                  WHEN 12 THEN 'Diciembre'
                END AS mesnombre,
                EXTRACT(YEAR FROM a.fecha)::int AS year
         FROM transaccion a
         JOIN codtrans b ON a.codtrans = b.id
         WHERE a.idcasa = $1
           AND a.zona = $2
           AND a.codtrans IN (1, 4)
           ${dateFilterSql}
         ORDER BY a.fecha DESC`,
        params
      );

      return res.json({
        ok: true,
        PagostransDB: result.rows
      });
  } catch(error){
    console.log('ERROR EN BKHISTORICOTRANSPAGOS:', error);
    return res.status(500).json({
        ok: false,
        msg: 'Hable con el administrador..',
        error: error.message
    });
  }
  
  
  }



  const bktransaldo =  async  (req, res = response) =>{

    let body = req.body;
    let casa = body.idcasa;
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

    if (casa === undefined || casa === null || casa === '') {
      return res.status(400).json({
        ok: false,
        msg: 'El campo casa es obligatorio'
      });
    }

    

    try {
      const result = await db.query(
        `SELECT c.casa, ca.nombrecalle AS calle, ca.sector, ca.barriada,
                COALESCE(SUM(a.monto * b.saldo), 0) AS saldo
         FROM transaccion a
         LEFT JOIN codtrans b ON b.id = a.codtrans
         LEFT JOIN casa c ON c.id = a.idcasa
         LEFT JOIN calle ca ON ca.idcodcalle = a.zona
         WHERE a.zona = $1
           AND a.idcasa = $2
         GROUP BY c.casa, calle, ca.sector, ca.barriada`,
        [zona, Number(casa)]
      );

      return res.json({
        ok: true,
        SaldotransDB: result.rows
      });
    } catch (error) {
      console.log('ERROR EN BKTRANSALDO:', error);
      return res.status(500).json({
        ok: false,
        msg: 'Hable con el administrador..',
        error: error.message
      });
    }
  }

  const bktransaldousuario = async (req, res = response) => {
    const tokenUserId = req.auth?.id;
    const tokenUser = req.auth?.user;
    const requestedIdUser = req.body?.iduser;

    if (!tokenUserId || !Number.isInteger(Number(tokenUserId))) {
      return res.status(401).json({
        ok: false,
        msg: 'Token inválido: no contiene id de usuario'
      });
    }

    if (requestedIdUser !== undefined && Number(requestedIdUser) !== Number(tokenUserId)) {
      return res.status(403).json({
        ok: false,
        msg: 'No puede consultar el saldo de otro usuario'
      });
    }

    try {
      const userResult = await db.query(
        `SELECT id, idcodcalle AS zona, casa AS idcasa
         FROM usuario
         WHERE id = $1 AND usuario = $2
         LIMIT 1`,
        [Number(tokenUserId), tokenUser]
      );

      if (!userResult.rows || userResult.rows.length === 0) {
        return res.status(403).json({
          ok: false,
          msg: 'El usuario del token no es válido para esta consulta'
        });
      }

      const { zona, idcasa } = userResult.rows[0];

      const saldoResult = await db.query(
        `SELECT c.casa, ca.nombrecalle AS calle, ca.sector, ca.barriada,
                COALESCE(SUM(a.monto * b.saldo), 0) AS saldo
         FROM transaccion a
         LEFT JOIN codtrans b ON b.id = a.codtrans
         LEFT JOIN casa c ON c.id = a.idcasa
         LEFT JOIN calle ca ON ca.idcodcalle = a.zona
         WHERE a.zona = $1
           AND a.idcasa = $2
         GROUP BY c.casa, calle, ca.sector, ca.barriada`,
        [zona, Number(idcasa)]
      );

      return res.json({
        ok: true,
        SaldotransDB: saldoResult.rows
      });
    } catch (error) {
      console.log('ERROR EN BKTRANSALDOUSUARIO:', error);
      return res.status(500).json({
        ok: false,
        msg: 'Hable con el administrador..',
        error: error.message
      });
    }
  }


  const bktranvalidacionanualidad =  async  (req, res = response) =>{

    var resultaGlobal;
  
    let body     =   req.body;
    let year = body.year
    let zona = body.zona
  

  try{
  
   

      sql.query(`
      select  DISTINCT( YEAR(fecha) )as year from transaccion
      where codtrans = 2
      and zona = '${zona}'
      and YEAR(fecha) = '${year}'
      `, (error, ValiAnualidadtransDB) => {
        if (error) 
        { console.error(error) }
  
  
       
          return res.json({
            ok: false,
            ValiAnualidadtransDB  
          
           
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



  const bkcodtrans =  async  (req, res = response) =>{
    try {
      const result = await db.query(
        `SELECT *
         FROM codtrans
         WHERE id IN (1, 4)
         ORDER BY id ASC`
      );

      return res.json({
        ok: true,
        CodtransDB: result.rows
      });
    } catch (error) {
      console.log('ERROR EN BKCODTRANS:', error);
      return res.status(500).json({
        ok: false,
        msg: 'Hable con el administrador..',
        error: error.message
      });
    }
  }

  const bkcodtransgasto =  async  (req, res = response) =>{
    const tokenRole = req.auth?.role;
    const isAdmin = String(tokenRole).toLowerCase() === 'admin' || String(tokenRole) === '1';

    if (!isAdmin) {
      return res.status(403).json({
        ok: false,
        msg: 'No tiene permisos de administrador'
      });
    }

    try {
      const result = await db.query(
        `SELECT *
         FROM codtrans
         WHERE id IN (3, 5)
         ORDER BY id ASC`
      );

      return res.json({
        ok: true,
        CodtransgastoDB: result.rows
      });
    } catch (error) {
      console.log('ERROR EN BKCODTRANSGASTO:', error);
      return res.status(500).json({
        ok: false,
        msg: 'Hable con el administrador..',
        error: error.message
      });
    }
  }



  const bktranallhomme =  async  (req, res = response) =>{

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

    try {
      const result = await db.query(
        `SELECT c.casa, COALESCE(SUM(a.monto * b.saldo), 0) AS saldo
         FROM transaccion a
         LEFT JOIN codtrans b ON b.id = a.codtrans
         LEFT JOIN casa c ON c.id = a.idcasa
         WHERE a.zona = $1
         GROUP BY c.casa
         ORDER BY c.casa ASC`,
        [zona]
      );

      return res.json({
        ok: true,
        SaldotransDB: result.rows
      });
    } catch (error) {
      console.log('ERROR EN BKTRANALLHOMME:', error);
      return res.status(500).json({
        ok: false,
        msg: 'Hable con el administrador..',
        error: error.message
      });
    }
  }



  const bkhistoricotranspagosGENERAL =  async  (req, res = response) =>{

    let body = req.body;
    let zona = body.zona;
    let filtro = body.filtro;
    const tokenRole = req.auth?.role;
    const isAdmin = String(tokenRole).toLowerCase() === 'admin' || String(tokenRole) === '1';

    if (!isAdmin) {
      return res.status(403).json({
        ok: false,
        msg: 'No tiene permisos de administrador'
      });
    }

    if (zona === undefined || zona === null || zona === '' || !filtro) {
      return res.status(400).json({
        ok: false,
        msg: 'Faltan campos obligatorios'
      });
    }

    let dateFilterSql = '';
    const params = [zona];
    if (filtro === 'Últimos 3 mese') {
      dateFilterSql = `AND a.fecha >= (CURRENT_DATE - INTERVAL '3 months')`;
    } else if (filtro === 'Últimos 30 días') {
      dateFilterSql = `AND a.fecha BETWEEN (CURRENT_DATE - INTERVAL '30 days') AND CURRENT_DATE`;
    } else {
      const year = Number(filtro);
      if (!Number.isInteger(year) || year < 1900 || year > 3000) {
        return res.status(400).json({
          ok: false,
          msg: 'El filtro debe ser un año válido o un rango permitido'
        });
      }
      params.push(year);
      dateFilterSql = `AND EXTRACT(YEAR FROM a.fecha) = $2`;
    }

  try{
      const result = await db.query(
        `SELECT a.id, a.zona, a.idadmin, a.fecha, a.monto, a.codtrans,
                a.detalle, a.idcasa, b.descripcion, c.nombre, c.apellido, x.casa,
                EXTRACT(MONTH FROM a.fecha)::int AS mes,
                CASE EXTRACT(MONTH FROM a.fecha)::int
                  WHEN 1 THEN 'Enero'
                  WHEN 2 THEN 'Febrero'
                  WHEN 3 THEN 'Marzo'
                  WHEN 4 THEN 'Abril'
                  WHEN 5 THEN 'Mayo'
                  WHEN 6 THEN 'Junio'
                  WHEN 7 THEN 'Julio'
                  WHEN 8 THEN 'Agosto'
                  WHEN 9 THEN 'Septiembre'
                  WHEN 10 THEN 'Octubre'
                  WHEN 11 THEN 'Noviembre'
                  WHEN 12 THEN 'Diciembre'
                END AS mesnombre,
                EXTRACT(YEAR FROM a.fecha)::int AS year
         FROM transaccion a
         JOIN codtrans b ON a.codtrans = b.id
         JOIN usuario c ON a.idadmin = c.id
         JOIN casa x ON a.idcasa = x.id
         WHERE a.zona = $1
           AND a.codtrans IN (1,4)
           ${dateFilterSql}
         ORDER BY a.fecha DESC`,
        params
      );

      return res.json({
        ok: true,
        PagostransDB: result.rows
      });
  } catch(error){
    console.log('ERROR EN BKHISTORICOTRANSPAGOSGENERAL:', error);
    return res.status(500).json({
        ok: false,
        msg: 'Hable con el administrador..',
        error: error.message
    });
  }
  
  
  }



module.exports = {
  bkhistoricotranspagosGENERAL,
    bkfiltropago,
    bkcodtrans,
    bkcodtransgasto,
    bkinsertransanualidad,
    bkinsertranscuota,
    bkhistoricotranspagos,
    bktransaldo,
    bktransaldousuario,
    bktranvalidacionanualidad,
    bktranallhomme
}
