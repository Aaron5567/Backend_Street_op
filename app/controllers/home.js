const { response } = require('express');
const sql = require('../models/connection_models');
const { dbQuery, isAdminRole } = require('../helpers/mysql-utils');

const ensureAdmin = (req, res) => {
  const tokenRole = req.auth?.role;
  const tokenUserId = req.auth?.id;
  const isAdmin = isAdminRole(tokenRole);

  if (!isAdmin) {
    res.status(403).json({
      ok: false,
      msg: 'No tiene permisos de administrador'
    });
    return null;
  }

  return { tokenRole, tokenUserId, isAdmin };
};

const bkupdatenamehome = async (req, res = response) => {
  const zona = req.body?.zona;
  const casa = req.body?.casa;
  const id = req.body?.id;
  const auth = ensureAdmin(req, res);
  if (!auth) {
    return;
  }

  const concatenacion = `${zona}${casa}`;

  if (zona === undefined || zona === null || zona === '' ||
      casa === undefined || casa === null || casa === '' ||
      id === undefined || id === null || id === '') {
    return res.status(400).json({
      ok: false,
      msg: 'Faltan campos obligatorios para actualizar la casa'
    });
  }

  try {
    const result = await dbQuery(
      `UPDATE casa
       SET casa = ?, idunico = ?
       WHERE id = ?
         AND idcodcalle = ?`,
      [casa, concatenacion, Number(id), zona]
    );

    if (result.affectedRows > 0) {
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
};

const bkinserthome = async (req, res = response) => {
  const zona = req.body?.zona;
  const casa = req.body?.casa;
  const idadmin = req.body?.idadmin;
  const auth = ensureAdmin(req, res);
  if (!auth) {
    return;
  }

  if (!auth.tokenUserId || Number(idadmin) !== Number(auth.tokenUserId)) {
    return res.status(403).json({
      ok: false,
      msg: 'El idadmin no coincide con el usuario autenticado'
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

  const concatenacion = `${zona}${casa}`;

  try {
    const idtopResult = await dbQuery(
      `SELECT idtop
       FROM calle
       WHERE idcodcalle = ?
       LIMIT 1`,
      [zona]
    );

    if (!idtopResult || idtopResult.length === 0) {
      return res.status(404).json({
        ok: false,
        msg: 'No se encontró la zona/calle'
      });
    }

    const idtop = Number(idtopResult[0].idtop);
    if (Number.isInteger(idtop) && idtop > 0) {
      const countResult = await dbQuery(
        `SELECT COUNT(*) AS total
         FROM casa
         WHERE idcodcalle = ?`,
        [zona]
      );
      const totalCasas = Number(countResult?.[0]?.total || 0);

      if (totalCasas >= idtop) {
        return res.status(400).json({
          ok: false,
          msg: `No se puede registrar más casas. Límite alcanzado (${idtop}).`
        });
      }
    }

    const result = await dbQuery(
      `INSERT INTO casa (idunico, idcodcalle, casa, idadmin)
       VALUES (?, ?, ?, ?)`,
      [concatenacion, zona, casa, idadmin]
    );

    if (result.affectedRows > 0) {
      return res.json({
        ok: true,
        msg: 'Se registro correctamente',
        id: result.insertId
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
};

const bkhome = async (req, res = response) => {
  const zona = req.body?.zona;
  const casa = req.body?.casa;
  const concatenacion = `${zona}${casa}`;

  try {
    sql.query(
      `SELECT * FROM casa where idunico = '${concatenacion}'
       and idcodcalle = '${zona}'`,
      (error, homeconsultaDB) => {
        if (error) {
          console.error(error);
        }

        return res.json({
          ok: false,
          homeconsultaDB
        });
      }
    );
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      msg: 'Hable con el administrador'
    });
  }
};

const bkhomeSEARCH = async (req, res = response) => {
  const zona = req.body?.zona;
  const casa = req.body?.casa;

  try {
    sql.query(
      `SELECT a.casa, b.nombrecalle,b.barriada,a.id
       FROM casa a, calle b
       where a.casa  LIKE '%${casa}%'
       and a.idcodcalle = b.idcodcalle
       and a.idcodcalle = '${zona}'`,
      (error, homeconsultasearchDB) => {
        if (error) {
          console.error(error);
        }

        return res.json({
          ok: false,
          homeconsultasearchDB
        });
      }
    );
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      msg: 'Hable con el administrador'
    });
  }
};

const bkSEARCHUSUARIO = async (req, res = response) => {
  const zona = req.body?.zona;
  const casa = req.body?.casa;

  try {
    sql.query(
      `SELECT a.casa, b.nombrecalle,b.barriada,a.id ,c.nombre ,
              c.apellido,c.usuario, c.id as idusuario
       FROM casa a, calle b, usuario c
       where a.casa LIKE '%${casa}%'
       and a.idcodcalle = b.idcodcalle
       and a.idcodcalle = '${zona}' and a.id = c.casa`,
      (error, SEARCHUSUARIO) => {
        if (error) {
          console.error(error);
        }

        return res.json({
          ok: true,
          SEARCHUSUARIO
        });
      }
    );
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      msg: 'Hable con el administrador'
    });
  }
};

const bkhomegettodo = async (req, res = response) => {
  const zona = req.body?.zona;
  const auth = ensureAdmin(req, res);
  if (!auth) {
    return;
  }

  if (!zona) {
    return res.status(400).json({
      ok: false,
      msg: 'Debe enviar la zona'
    });
  }

  try {
    const result = await dbQuery(
      `SELECT a.id, a.idcodcalle, a.casa, b.nombrecalle, b.barriada,
              a.idunico, a.idadmin, b.idtop
       FROM casa a
       JOIN calle b ON a.idcodcalle = b.idcodcalle
       WHERE a.idcodcalle = ?
       ORDER BY a.casa ASC`,
      [zona]
    );

    return res.json({
      ok: true,
      homeconsultodoDB: result
    });
  } catch (error) {
    console.log('ERROR EN BKHOMEGETTODO:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Hable con el administrador..',
      error: error.message
    });
  }
};

const bkidtophome = async (req, res = response) => {
  const zona = req.body?.zona;

  try {
    sql.query(
      `SELECT COUNT(id) as idtop
       FROM casa WHERE idcodcalle = '${zona}'`,
      (error, IdtophomeDB) => {
        if (error) {
          console.error(error);
        }

        return res.json({
          ok: false,
          IdtophomeDB
        });
      }
    );
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      msg: 'Hable con el administrador'
    });
  }
};

const bkcalle = async (req, res = response) => {
  const zona = req.body?.zona;

  try {
    sql.query(
      `SELECT * FROM calle where idcodcalle  = '${zona}'`,
      (error, CalleDB) => {
        if (error) {
          console.error(error);
        }

        return res.json({
          ok: false,
          CalleDB
        });
      }
    );
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      msg: 'Hable con el administrador'
    });
  }
};

const bkupdatemensualidad = async (req, res = response) => {
  const zona = req.body?.zona;
  const monto = req.body?.monto;

  try {
    sql.query(
      `update calle set mensualidad ='${monto}'
       where idcodcalle  = '${zona}'`,
      (error, UpdatemensualidadCalleDB) => {
        if (error) {
          return res.status(500).json({
            ok: false,
            msg: 'Error al registrar el Pago'
          });
        }

        if (UpdatemensualidadCalleDB.affectedRows > 0) {
          return res.json({
            ok: true,
            msg: 'Se cambio la mensualidad correctamente'
          });
        }

        return res.json({
          ok: false,
          msg: 'No se registro la información'
        });
      }
    );
  } catch (error) {
    return res.json({
      ok: false,
      msg: error
    });
  }
};

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
};
