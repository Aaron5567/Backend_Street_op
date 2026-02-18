const { response } = require('express');
const sql = require('../models/connection_models');
const db = require('../config/connection');

const bkupdatenamehome = async (req, res = response) => {
    let body = req.body;
    let zona = body.zona;
    let casa = body.casa;
    let id = body.id;

    console.log('Datos recibidos en bkupdatenamehome:', { zona, casa, id });
    const tokenRole = req.auth?.role;
    const isAdmin = String(tokenRole).toLowerCase() === 'admin' || String(tokenRole) === '1';
    let concatenacion = `${zona}${casa}`;

    if (!isAdmin) {
        return res.status(403).json({
            ok: false,
            msg: 'No tiene permisos de administrador'
        });
    }

    if (zona === undefined || zona === null || zona === '' ||
        casa === undefined || casa === null || casa === '' ||
        id === undefined || id === null || id === '') {
        return res.status(400).json({
            ok: false,
            msg: 'Faltan campos obligatorios para actualizar la casa'
        });
    }

    try {
        const result = await db.query(
            `UPDATE casa
             SET casa = $1, idunico = $2
             WHERE id = $3
               AND idcodcalle = $4`,
            [casa, concatenacion, Number(id), zona]
        );

        if (result.rowCount > 0) {
            return res.json({
                ok: true,
                msg: 'Se actualizó correctamente'
            });
        }

        return res.status(404).json({
            ok: false,
            msg: 'No se encontró la casa para actualizar'
        });
    } catch (error) {
        console.log('ERROR EN BKUPDATENAMEHOME:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Hable con el administrador..',
            error: error.message
        });

    }


}
const bkinserthome = async (req, res = response) => {
    let body = req.body;
    let zona = body.zona;
    let casa = body.casa;
    let idadmin = body.idadmin;
    const tokenRole = req.auth?.role;
    const isAdmin = String(tokenRole).toLowerCase() === 'admin' || String(tokenRole) === '1';
    let concatenacion = `${zona}${casa}`;

    if (!isAdmin) {
        return res.status(403).json({
            ok: false,
            msg: 'No tiene permisos de administrador'
        });
    }

    if (zona === undefined || zona === null || zona === '' ||
        casa === undefined || casa === null || casa === '' ||
        idadmin === undefined || idadmin === null || idadmin === '') {
        return res.status(400).json({
            ok: false,
            msg: 'Faltan campos obligatorios para registrar el IdHome'
        });
    }

    try {
        const idtopResult = await db.query(
            `SELECT idtop
             FROM calle
             WHERE idcodcalle = $1
             LIMIT 1`,
            [zona]
        );

        if (!idtopResult.rows || idtopResult.rows.length === 0) {
            return res.status(404).json({
                ok: false,
                msg: 'No se encontró la zona/calle'
            });
        }



        const idtop = Number(idtopResult.rows[0].idtop);

        console.log('idtop obtenido:', idtop);
        if (Number.isInteger(idtop) && idtop > 0) {
            const countResult = await db.query(
                `SELECT COUNT(*)::int AS total
                 FROM casa
                 WHERE idcodcalle = $1`,
                [zona]
            );
            const totalCasas = Number(countResult.rows?.[0]?.total || 0);
  console.log('Total casas en la zona:', totalCasas);
            if (totalCasas >= idtop) {
                return res.status(400).json({
                    ok: false,
                    msg: `No se puede registrar más casas. Límite alcanzado (${idtop}).`
                });
            }
        }

        const insertSql = `INSERT INTO casa (idunico, idcodcalle, casa, idadmin)
             VALUES ($1, $2, $3, $4)
             RETURNING id`;
        const insertParams = [concatenacion, zona, casa, idadmin];

        let result;
        try {
            result = await db.query(insertSql, insertParams);
        } catch (error) {
            // Si la secuencia del id quedó atrás por migración/importación,
            // la sincronizamos y reintentamos una sola vez.
            if (error.code === '23505' && error.constraint === 'casa_pkey') {
                await db.query(
                    `SELECT setval(
                      pg_get_serial_sequence('public.casa', 'id'),
                      COALESCE((SELECT MAX(id) FROM public.casa), 0) + 1,
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
        console.log('ERROR EN BKINSERTHOME:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error al registrar el IdHome',
            error: error.message
        });
    }
}

const bkhome = async (req, res = response) => {
    let body = req.body;
    let zona = body.zona
    let casa = body.casa
    let concatenacion = zona+casa
    try {
        const veficar_existe =
        sql.query(`SELECT * FROM casa where idunico = '${concatenacion}'
        and idcodcalle = '${zona}'
        `, (error, homeconsultaDB) => {
                if (error) { console.error(error) }

                return res.json({
                    ok: false,
                    homeconsultaDB
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

const bkhomeSEARCH = async (req, res = response) => {
    let body = req.body;
    let zona = body.zona
    let casa = body.casa

 
    try {

        const veficar_existe =

        sql.query(`SELECT a.casa, b.nombrecalle,b.barriada,a.id
        FROM casa a, calle b
        where a.casa  LIKE '%${casa}%'  
        and a.idcodcalle = b.idcodcalle
        and a.idcodcalle = '${zona}'
        `, (error, homeconsultasearchDB) => {
                if (error) { console.error(error) }



                return res.json({
                    ok: false,
                    homeconsultasearchDB
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

const bkSEARCHUSUARIO = async (req, res = response) => {
    let body = req.body;
    let zona = body.zona
    let casa = body.casa

 
    try {

        const veficar_existe =

        sql.query(`

        SELECT a.casa, b.nombrecalle,b.barriada,a.id ,c.nombre ,
c.apellido,c.usuario, c.id as idusuario
FROM casa a, calle b, usuario c 
where a.casa LIKE '%${casa}%'
 and a.idcodcalle = b.idcodcalle
  and a.idcodcalle = '${zona}' and a.id = c.casa
        `, (error, SEARCHUSUARIO ) => {
                if (error) { console.error(error) }



                return res.json({
                    ok: true,
                    SEARCHUSUARIO 
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


const bkhomegettodo= async (req, res = response) => {
    const zona = req.body?.zona;

    if (!zona) {
        return res.status(400).json({
            ok: false,
            msg: 'Debe enviar la zona'
        });
    }

    try {
        const result = await db.query(
            `SELECT a.id, a.idcodcalle, a.casa, b.nombrecalle, b.barriada,
                    a.idunico, a.idadmin, b.idtop
             FROM casa a
             JOIN calle b ON a.idcodcalle = b.idcodcalle
             WHERE a.idcodcalle = $1
             ORDER BY a.casa ASC`,
            [zona]
        );

        return res.json({
            ok: true,
            homeconsultodoDB: result.rows
        });
    } catch (error) {
        console.log('ERROR EN BKHOMEGETTODO:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Hable con el administrador..',
            error: error.message
        });
    }
}




const bkidtophome= async (req, res = response) => {
    let body = req.body;
    let zona = body.zona
   

   
    try {

        const veficar_existe =

        sql.query(`SELECT COUNT(id) as idtop 
        FROM casa WHERE idcodcalle = '${zona}'
        `, (error, IdtophomeDB) => {
                if (error) { console.error(error) }



                return res.json({
                    ok: false,
                    IdtophomeDB
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



const bkcalle= async (req, res = response) => {
    let body = req.body;
    let zona = body.zona
   
    try {

        const veficar_existe =

        sql.query(`SELECT * FROM calle where idcodcalle  = '${zona}'
        `, (error, CalleDB) => {
                if (error) { console.error(error) }



                return res.json({
                    ok: false,
                    CalleDB
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


const bkupdatemensualidad= async (req, res = response) => {
    let body = req.body;
    let zona = body.zona
    let monto = body.monto
   
    try {

        const veficar_existe =

        sql.query(`update calle set mensualidad ='${monto}'
         where idcodcalle  = '${zona}'
        `, (error, UpdatemensualidadCalleDB) => {
            if (error) { 
                return res.status(500).json({
                  ok:false,
                  msg: 'Error al registrar el Pago'
                })
               }

               if(UpdatemensualidadCalleDB.affectedRows > 0 ){

                return res.json({
                    ok: true,
                    msg : 'Se cambio la mensualidad correctamente'
                   /*  UpdatemensualidadCalleDB */
                });
                
            }else{
                return res.json({
                  ok: false,
                  msg : 'No se registro la información'
              }); 
              }


            });


    } catch (error) {
       
        res.json({
            ok: false,
            msg: error
        });

    }


}
module.exports = {
    bkupdatemensualidad,
    bkcalle,
    bkidtophome,
    bkinserthome,
    bkhome,
    bkhomeSEARCH,
    bkhomegettodo,
    bkupdatenamehome,
    bkSEARCHUSUARIO
   }
