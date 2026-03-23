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

const monthNameCase = (field) => `CASE MONTH(${field})
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
END`;

const buildFiltroFecha = (filtro, field = 'a.fecha') => {
  if (filtro === 'Últimos 3 mese') {
    return {
      clause: `AND ${field} >= (CURDATE() - INTERVAL 3 MONTH)`,
      params: []
    };
  }

  if (filtro === 'Últimos 30 días') {
    return {
      clause: `AND ${field} BETWEEN (CURDATE() - INTERVAL 30 DAY) AND CURDATE()`,
      params: []
    };
  }

  const year = Number(filtro);
  if (!Number.isInteger(year) || year < 1900 || year > 3000) {
    return {
      error: {
        ok: false,
        msg: 'El filtro debe ser un año válido o un rango permitido'
      }
    };
  }

  return {
    clause: `AND YEAR(${field}) = ?`,
    params: [year]
  };
};

const bkpdfresumengasto = async (req, res = response) => {
  const zona = req.body?.zona;
  const filtro = req.body?.filtro;
  const auth = ensureAdmin(req, res);
  if (!auth) {
    return;
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

  try {
    const result = await dbQuery(
      `SELECT a.fecha, c.nombre, a.comentario, COALESCE(SUM(a.monto * b.saldo), 0) AS saldo
       FROM historicogastos a
       LEFT JOIN codtrans b ON b.id = a.codtrans
       LEFT JOIN opgasto c ON c.id = a.idopgasto
       WHERE a.idzona = ?
         AND YEAR(a.fecha) = ?
       GROUP BY a.fecha, c.nombre, a.comentario
       ORDER BY a.fecha ASC`,
      [zona, year]
    );

    return res.json({
      ok: true,
      SaldotranspdfgastoDB: result
    });
  } catch (error) {
    console.log('ERROR EN BKPDFRESUMENGASTO:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Hable con el administrador..',
      error: error.message
    });
  }
};

const bkgastos = async (req, res = response) => {
  const zona = req.body?.zona;
  const filtro = req.body?.filtro;
  const auth = ensureAdmin(req, res);
  if (!auth) {
    return;
  }

  if (zona === undefined || zona === null || zona === '' || !filtro) {
    return res.status(400).json({
      ok: false,
      msg: 'Faltan campos obligatorios'
    });
  }

  const filtroFecha = buildFiltroFecha(filtro);
  if (filtroFecha.error) {
    return res.status(400).json(filtroFecha.error);
  }

  try {
    const result = await dbQuery(
      `SELECT a.fecha, a.comentario, a.monto, b.nombre, a.id, a.idopgasto AS idgastos, b.idcodcalle,
              MONTH(a.fecha) AS mes, a.codtrans,
              ${monthNameCase('a.fecha')} AS mesnombre,
              YEAR(a.fecha) AS year
       FROM historicogastos a
       JOIN opgasto b ON a.idopgasto = b.id
       WHERE a.idzona = ?
         ${filtroFecha.clause}
       ORDER BY a.fecha DESC`,
      [zona, ...filtroFecha.params]
    );

    if (!result || result.length === 0) {
      return res.json({
        ok: false,
        msg: 'No Hay registros'
      });
    }

    return res.json({
      ok: true,
      GastosDB: result
    });
  } catch (error) {
    console.log('ERROR EN BKGASTOS:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Hable con el administrador..',
      error: error.message
    });
  }
};

const bkfiltroyeargasto = async (req, res = response) => {
  const zona = req.body?.zona;
  const auth = ensureAdmin(req, res);
  if (!auth) {
    return;
  }

  if (zona === undefined || zona === null || zona === '') {
    return res.status(400).json({
      ok: false,
      msg: 'El campo zona es obligatorio'
    });
  }

  try {
    const result = await dbQuery(
      `SELECT year
       FROM (
         SELECT DISTINCT CAST(YEAR(a.fecha) AS CHAR) AS year,
                YEAR(a.fecha) AS sort_order
         FROM historicogastos a
         WHERE a.idzona = ?

         UNION ALL
         SELECT 'Últimos 3 mese' AS year, 100000 AS sort_order

         UNION ALL
         SELECT 'Últimos 30 días' AS year, 99999 AS sort_order
       ) x
       ORDER BY sort_order DESC`,
      [zona]
    );

    if (!result || result.length === 0) {
      return res.json({
        ok: false,
        msg: 'No hay registros'
      });
    }

    return res.json({
      ok: true,
      FiltroDbGastos: result
    });
  } catch (error) {
    console.log('ERROR EN BKFILTROYEARGASTO:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Hable con el administrador..',
      error: error.message
    });
  }
};

const bkOPgastos = async (req, res = response) => {
  const zona = req.body?.zona;
  const auth = ensureAdmin(req, res);
  if (!auth) {
    return;
  }

  if (zona === undefined || zona === null || zona === '') {
    return res.status(400).json({
      ok: false,
      msg: 'El campo zona es obligatorio'
    });
  }

  try {
    const result = await dbQuery(
      `SELECT * FROM opgasto WHERE idcodcalle = ? ORDER BY id ASC`,
      [zona]
    );

    return res.json({
      ok: true,
      GastosOPDB: result
    });
  } catch (error) {
    console.log('ERROR EN BKOPGASTOS:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Hable con el administrador..',
      error: error.message
    });
  }
};

const bkOPgastosinsert = async (req, res = response) => {
  const zona = req.body?.zona;
  const idopgasto = req.body?.idopgasto;
  const monto = req.body?.monto;
  const detalle = req.body?.detalle;
  const fecha = req.body?.fecha;
  const idadmin = req.body?.idadmin;
  const codtrans = req.body?.codtrans;
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
    const result = await dbQuery(
      `INSERT INTO historicogastos (fecha, idzona, idopgasto, monto, comentario, idadmin, codtrans)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [fecha, zona, idopgasto, monto, detalle, idadmin, codtrans]
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
};

const bkinsertgastosector = async (req, res = response) => {
  const zona = req.body?.zona;
  const nombresector = req.body?.nombresector;
  const auth = ensureAdmin(req, res);
  if (!auth) {
    return;
  }

  if (zona === undefined || zona === null || zona === '' ||
      !nombresector || String(nombresector).trim() === '') {
    return res.status(400).json({
      ok: false,
      msg: 'Faltan campos obligatorios para registrar el Sector de Gasto'
    });
  }

  try {
    const result = await dbQuery(
      `INSERT INTO opgasto (idcodcalle, nombre)
       VALUES (?, ?)`,
      [zona, String(nombresector).trim()]
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
    console.log('ERROR EN BKINSERTGASTOSECTOR:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Error al registrar el Sector de Gasto',
      error: error.message
    });
  }
};

const bkpagoinsert = async (req, res = response) => {
  const zona = req.body?.zona;
  const monto = req.body?.monto;
  const fecha = req.body?.fecha;
  const idadmin = req.body?.idadmin;
  const casa = req.body?.casa;

  try {
    sql.query(
      `INSERT INTO pagos
       VALUES (${null},${zona},'${fecha}','${casa}','${monto}', '${idadmin}')`,
      (error, PagohistoricoDB) => {
        if (error) {
          console.error(error);
        }

        return res.json({
          ok: false,
          PagohistoricoDB
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

module.exports = {
  bkgastos,
  bkOPgastos,
  bkOPgastosinsert,
  bkinsertgastosector,
  bkpagoinsert,
  bkfiltroyeargasto,
  bkpdfresumengasto
};
