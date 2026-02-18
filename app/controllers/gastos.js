
const e = require('express');
const { response } = require('express');
const sql = require('../models/connection_models');
const db = require('../config/connection');



const bkpdfresumengasto =  async  (req, res = response) =>{

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

    if (zona === undefined || zona === null || zona === '') {
        return res.status(400).json({
            ok: false,
            msg: 'El campo zona es obligatorio'
        });
    }

    const year = Number(filtro);
    if (!Number.isInteger(year) || year < 1900 || year > 3000) {
        return res.status(400).json({
            ok: false,
            msg: 'El campo filtro debe ser un año válido'
        });
    }

  try{
      const result = await db.query(
        `SELECT a.fecha, c.nombre, a.comentario, COALESCE(SUM(a.monto * b.saldo), 0) AS saldo
         FROM historicogastos a
         LEFT JOIN codtrans b ON b.id = a.codtrans
         LEFT JOIN opgasto c ON c.id = a.idopgasto
         WHERE a.idzona = $1
           AND EXTRACT(YEAR FROM a.fecha) = $2
         GROUP BY a.fecha, c.nombre, a.comentario
         ORDER BY a.fecha ASC`,
        [zona, year]
      );

      return res.json({
        ok: true,
        SaldotranspdfgastoDB: result.rows
      });
  } catch(error){
    console.log('ERROR EN BKPDFRESUMENGASTO:', error);
    return res.status(500).json({
        ok: false,
        msg: 'Hable con el administrador..',
        error: error.message
    });
  }
  
  
  }



const bkgastos = async (req, res = response) => {

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

    try {
        const result = await db.query(
            `SELECT a.fecha, a.comentario, a.monto, b.nombre, a.id, a.idopgasto AS idgastos, b.idcodcalle,
                    EXTRACT(MONTH FROM a.fecha)::int AS mes, a.codtrans,
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
             FROM historicogastos a
             JOIN opgasto b ON a.idopgasto = b.id
             WHERE a.idzona = $1
               ${dateFilterSql}
             ORDER BY a.fecha DESC`,
            params
        );

        if (!result.rows || result.rows.length === 0) {
            return res.json({
                ok: false,
                msg: 'No Hay registros'
            });
        }

        return res.json({
            ok: true,
            GastosDB: result.rows
        });
    } catch (error) {
        console.log('ERROR EN BKGASTOS:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Hable con el administrador..',
            error: error.message
        });

    }


}



const bkfiltroyeargasto = async (req, res = response) => {

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
            `SELECT year
             FROM (
               SELECT DISTINCT EXTRACT(YEAR FROM a.fecha)::int::text AS year,
                      EXTRACT(YEAR FROM a.fecha)::int AS sort_order
               FROM historicogastos a
               WHERE a.idzona = $1

               UNION ALL
               SELECT 'Últimos 3 mese' AS year, 100000 AS sort_order

               UNION ALL
               SELECT 'Últimos 30 días' AS year, 99999 AS sort_order
             ) x
             ORDER BY sort_order DESC`,
            [zona]
        );

        if (!result.rows || result.rows.length === 0) {
            return res.json({
                ok: false,
                msg: 'No hay registros'
            });
        }

        return res.json({
            ok: true,
            FiltroDbGastos: result.rows
        });
    } catch (error) {
        console.log('ERROR EN BKFILTROYEARGASTO:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Hable con el administrador..',
            error: error.message
        });
    }

   
}

const bkOPgastos = async (req, res = response) => {

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
            `SELECT * FROM opgasto WHERE idcodcalle = $1 ORDER BY id ASC`,
            [zona]
        );

        return res.json({
            ok: true,
            GastosOPDB: result.rows
        });
    } catch (error) {
        console.log('ERROR EN BKOPGASTOS:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Hable con el administrador..',
            error: error.message
        });
    }
}


const bkOPgastosinsert = async (req, res = response) => {
    let body = req.body;
    let zona = body.zona;
    let idopgasto = body.idopgasto;
    let monto = body.monto;
    let detalle = body.detalle;
    let fecha = body.fecha;
    let idadmin = body.idadmin;
    let codtrans = body.codtrans;
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

    if (zona === undefined || zona === null || zona === '' ||
        idopgasto === undefined || idopgasto === null || idopgasto === '' ||
        monto === undefined || monto === null || monto === '' ||
        !fecha ||
        codtrans === undefined || codtrans === null || codtrans === '') {
        return res.status(400).json({
            ok: false,
            msg: 'Faltan campos obligatorios para registrar el gasto'
        });
    }

    try {
        const insertSql = `INSERT INTO historicogastos (fecha, idzona, idopgasto, monto, comentario, idadmin, codtrans)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id`;
        const insertParams = [fecha, zona, idopgasto, monto, detalle, idadmin, codtrans];

        let result;
        try {
            result = await db.query(insertSql, insertParams);
        } catch (error) {
            // Si la secuencia del id quedó atrás por migración/importación,
            // la sincronizamos y reintentamos una sola vez.
            if (error.code === '23505' && error.constraint === 'historicogastos_pkey') {
                await db.query(
                    `SELECT setval(
                      pg_get_serial_sequence('public.historicogastos', 'id'),
                      COALESCE((SELECT MAX(id) FROM public.historicogastos), 0) + 1,
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
                msg: 'Se registro correctamente',
                id: result.rows[0].id
            });
        }

        return res.json({
            ok: false,
            msg: 'No se registro correctamente la información'
        });
    } catch (error) {
        console.log('ERROR EN BKOPGASTOSINSERT:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error al registrar el Gasto',
            error: error.message
        });
    }
}


const bkinsertgastosector = async (req, res = response) => {
    let body = req.body;
    let zona = body.zona;
    let nombresector = body.nombresector;
    const tokenRole = req.auth?.role;
    const isAdmin = String(tokenRole).toLowerCase() === 'admin' || String(tokenRole) === '1';

    if (!isAdmin) {
        return res.status(403).json({
            ok: false,
            msg: 'No tiene permisos de administrador'
        });
    }

    if (zona === undefined || zona === null || zona === '' ||
        !nombresector || String(nombresector).trim() === '') {
        return res.status(400).json({
            ok: false,
            msg: 'Faltan campos obligatorios para registrar el Sector de Gasto'
        });
    }

    try {
        const insertSql = `INSERT INTO opgasto (idcodcalle, nombre)
             VALUES ($1, $2)
             RETURNING id`;
        const insertParams = [zona, String(nombresector).trim()];

        let result;
        try {
            result = await db.query(insertSql, insertParams);
        } catch (error) {
            // Si la secuencia del id quedó atrás por migración/importación,
            // la sincronizamos y reintentamos una sola vez.
            if (error.code === '23505' && error.constraint === 'opgasto_pkey') {
                await db.query(
                    `SELECT setval(
                      pg_get_serial_sequence('public.opgasto', 'id'),
                      COALESCE((SELECT MAX(id) FROM public.opgasto), 0) + 1,
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
                msg: 'Se registro correctamente',
                id: result.rows[0].id
            });
        }

        return res.json({
            ok: false,
            msg: 'No se registro la información'
        });
    } catch (error) {
        console.log('ERROR EN BKINSERTGASTOSECTOR:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error al registrar el Sector de Gasto',
            error: error.message
        });

    }


}




const bkpagoinsert = async (req, res = response) => {
    let body = req.body;
    let zona = body.zona
    let monto = body.monto
    let fecha = body.fecha
    let idadmin = body.idadmin
    let casa = body.casa
   /*  console.log(zona)
    console.log(monto)
    console.log(fecha)
    console.log(idadmin)
    console.log(casa) */
    try {

        const veficar_existe =

            sql.query(`
            INSERT INTO pagos
            VALUES ( ${null} ,${zona},'${fecha}','${casa}','${monto}', '${idadmin}')
            
            `, (error, PagohistoricoDB) => {
                if (error) { console.error(error) }



                return res.json({
                    ok: false,
                    PagohistoricoDB


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
    bkgastos,
    bkOPgastos,
    bkOPgastosinsert,
    bkinsertgastosector,
    bkpagoinsert,
    bkfiltroyeargasto,
    bkpdfresumengasto
}
