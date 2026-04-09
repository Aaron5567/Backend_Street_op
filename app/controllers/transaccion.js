const { response } = require('express');
const { dbQuery, isAdminRole } = require('../helpers/mysql-utils');
const { processMonthlyCharges } = require('../services/monthly-charges');

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

const bkinsertransanualidad = async (req, res = response) => {
  const body = req.body;
  const zona = body.zona;
  const casa = body.casa;
  const monto = body.monto;
  const fecha = body.fecha;
  const idadmin = body.idadmin;
  const codtrans = 2;
  const detalle = 'Anualidad';

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

  try {
    const casas = JSON.parse(casa);

    for (const item of casas) {
      await dbQuery(
        `INSERT INTO transaccion
         (zona, idadmin, fecha, monto, codtrans, detalle, idcasa)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [zona, idadmin, fecha, monto, codtrans, detalle, item.id]
      );
    }

    return res.json({ ok: true });
  } catch (error) {
    console.log('ERROR EN BKINSERTRANSANUALIDAD:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Hable con el administrador',
      error: error.message
    });
  }
};

const bkinsertranscuota = async (req, res = response) => {
  const body = req.body;
  const zona = body.zona;
  const idcasa = body.idcasa;
  const monto = body.monto;
  const fecha = body.fecha;
  const idadmin = body.idadmin;
  const codtrans = body.codtrans;
  const detalle = body.detalle;

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

  try {
    const result = await dbQuery(
      `INSERT INTO transaccion
       (zona, idadmin, fecha, monto, codtrans, detalle, idcasa)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [zona, idadmin, fecha, monto, codtrans, detalle, idcasa]
    );

    if (result.affectedRows > 0) {
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
};

const bkfiltropago = async (req, res = response) => {
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
         FROM transaccion a
         WHERE a.zona = ?
           AND a.codtrans <> 2

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
      FiltroDbPago: result
    });
  } catch (error) {
    console.log('ERROR EN BKFILTROPAGO:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Hable con el administrador..',
      error: error.message
    });
  }
};

const bkhistoricotranspagos = async (req, res = response) => {
  const body = req.body;
  const casa = body.casa;
  const zona = body.zona;
  const filtro = body.filtro;
  const auth = ensureAdmin(req, res);
  if (!auth) {
    return;
  }

  if (zona === undefined || zona === null || zona === '' ||
      casa === undefined || casa === null || casa === '' ||
      !filtro) {
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
      `SELECT a.id, a.zona, a.idadmin, a.fecha, a.monto, a.codtrans,
              a.detalle, a.idcasa, b.descripcion,
              MONTH(a.fecha) AS mes,
              ${monthNameCase('a.fecha')} AS mesnombre,
              YEAR(a.fecha) AS year
       FROM transaccion a
       JOIN codtrans b ON a.codtrans = b.id
       WHERE a.idcasa = ?
         AND a.zona = ?
         AND a.codtrans IN (1, 4)
         ${filtroFecha.clause}
       ORDER BY a.fecha DESC`,
      [Number(casa), zona, ...filtroFecha.params]
    );

    return res.json({
      ok: true,
      PagostransDB: result
    });
  } catch (error) {
    console.log('ERROR EN BKHISTORICOTRANSPAGOS:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Hable con el administrador..',
      error: error.message
    });
  }
};

const bktransaldo = async (req, res = response) => {
  const casa = req.body?.idcasa;
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

  if (casa === undefined || casa === null || casa === '') {
    return res.status(400).json({
      ok: false,
      msg: 'El campo casa es obligatorio'
    });
  }

  try {
    const result = await dbQuery(
      `SELECT c.casa, ca.nombrecalle AS calle, ca.sector, ca.barriada,
              COALESCE(SUM(a.monto * b.saldo), 0) AS saldo
       FROM transaccion a
       LEFT JOIN codtrans b ON b.id = a.codtrans
       LEFT JOIN casa c ON c.id = a.idcasa
       LEFT JOIN calle ca ON ca.idcodcalle = a.zona
       WHERE a.zona = ?
         AND a.idcasa = ?
       GROUP BY c.casa, calle, ca.sector, ca.barriada`,
      [zona, Number(casa)]
    );

    return res.json({
      ok: true,
      SaldotransDB: result
    });
  } catch (error) {
    console.log('ERROR EN BKTRANSALDO:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Hable con el administrador..',
      error: error.message
    });
  }
};

const bkresumensaldocasa = async (req, res = response) => {
  const zona = req.body?.zona;
  const idcasa = req.body?.idcasa;
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

  if (idcasa === undefined || idcasa === null || idcasa === '') {
    return res.status(400).json({
      ok: false,
      msg: 'El campo idcasa es obligatorio'
    });
  }

  try {
    const result = await dbQuery(
      `WITH movimientos AS (
         SELECT a.idcasa,
                a.zona,
                date(a.fecha) AS fecha,
                a.monto,
                b.saldo,
                (a.monto * b.saldo) AS valor,
                a.codtrans,
                ROW_NUMBER() OVER (
                  PARTITION BY a.idcasa, a.zona
                  ORDER BY a.fecha DESC, a.id DESC
                ) AS rn,
                ROW_NUMBER() OVER (
                  PARTITION BY a.idcasa, a.zona, a.codtrans
                  ORDER BY a.fecha DESC, a.id DESC
                ) AS rn_tipo
         FROM transaccion a
         LEFT JOIN codtrans b ON b.id = a.codtrans
         WHERE a.zona = ?
           AND a.idcasa = ?
       )
       SELECT c.casa,
              ca.nombrecalle AS calle,
              ca.sector,
              ca.barriada,
              COALESCE(SUM(m.valor), 0) AS saldo_actual,
              COALESCE(SUM(CASE WHEN m.rn > 1 THEN m.valor ELSE 0 END), 0) AS saldo_anterior,
              MAX(CASE WHEN m.saldo = -1 THEN m.fecha END) AS ultima_fecha_pago,
              MAX(CASE WHEN m.codtrans = 2 AND m.rn_tipo = 1 THEN m.fecha END) AS ultima_fecha_cargo,
              MAX(CASE WHEN m.codtrans = 2 AND m.rn_tipo = 1 THEN m.monto END) AS monto_ultimo_cargo
       FROM movimientos m
       LEFT JOIN casa c ON c.id = m.idcasa
       LEFT JOIN calle ca ON ca.idcodcalle = m.zona
       GROUP BY c.casa, calle, ca.sector, ca.barriada`,
      [zona, Number(idcasa)]
    );

    return res.json({
      ok: true,
      ResumenSaldoCasaDB: result
    });
  } catch (error) {
    console.log('ERROR EN BKRESUMENSALDOCASA:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Hable con el administrador..',
      error: error.message
    });
  }
};

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
    const userResult = await dbQuery(
      `SELECT id, idcodcalle AS zona, casa AS idcasa
       FROM usuario
       WHERE id = ? AND usuario = ?
       LIMIT 1`,
      [Number(tokenUserId), tokenUser]
    );

    if (!userResult || userResult.length === 0) {
      return res.status(403).json({
        ok: false,
        msg: 'El usuario del token no es válido para esta consulta'
      });
    }

    const { zona, idcasa } = userResult[0];
    const saldoResult = await dbQuery(
      `SELECT c.casa, ca.nombrecalle AS calle, ca.sector, ca.barriada,
              COALESCE(SUM(a.monto * b.saldo), 0) AS saldo
       FROM transaccion a
       LEFT JOIN codtrans b ON b.id = a.codtrans
       LEFT JOIN casa c ON c.id = a.idcasa
       LEFT JOIN calle ca ON ca.idcodcalle = a.zona
       WHERE a.zona = ?
         AND a.idcasa = ?
       GROUP BY c.casa, calle, ca.sector, ca.barriada`,
      [zona, Number(idcasa)]
    );

    return res.json({
      ok: true,
      SaldotransDB: saldoResult
    });
  } catch (error) {
    console.log('ERROR EN BKTRANSALDOUSUARIO:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Hable con el administrador..',
      error: error.message
    });
  }
};

const bktranvalidacionanualidad = async (req, res = response) => {
  const year = req.body?.year;
  const zona = req.body?.zona;

  try {
    const ValiAnualidadtransDB = await dbQuery(
      `SELECT DISTINCT YEAR(fecha) AS year
       FROM transaccion
       WHERE codtrans = 2
         AND zona = ?
         AND YEAR(fecha) = ?`,
      [zona, year]
    );

    return res.json({
      ok: false,
      ValiAnualidadtransDB
    });
  } catch (error) {
    console.log('ERROR EN BKTRANVALIDACIONANUALIDAD:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Hable con el administrador'
    });
  }
};

const bkcodtrans = async (req, res = response) => {
  const auth = ensureAdmin(req, res);
  if (!auth) {
    return;
  }

  try {
    const result = await dbQuery(
      `SELECT *
       FROM codtrans
       WHERE id IN (1, 4)
       ORDER BY id ASC`
    );

    return res.json({
      ok: true,
      CodtransDB: result
    });
  } catch (error) {
    console.log('ERROR EN BKCODTRANS:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Hable con el administrador..',
      error: error.message
    });
  }
};

const bkcodtransgasto = async (req, res = response) => {
  const auth = ensureAdmin(req, res);
  if (!auth) {
    return;
  }

  try {
    const result = await dbQuery(
      `SELECT *
       FROM codtrans
       WHERE id IN (3, 5)
       ORDER BY id ASC`
    );

    return res.json({
      ok: true,
      CodtransgastoDB: result
    });
  } catch (error) {
    console.log('ERROR EN BKCODTRANSGASTO:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Hable con el administrador..',
      error: error.message
    });
  }
};

const bktranallhomme = async (req, res = response) => {
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
      `SELECT c.casa, COALESCE(SUM(a.monto * b.saldo), 0) AS saldo
       FROM transaccion a
       LEFT JOIN codtrans b ON b.id = a.codtrans
       LEFT JOIN casa c ON c.id = a.idcasa
       WHERE a.zona = ?
       GROUP BY c.casa
       ORDER BY c.casa ASC`,
      [zona]
    );

    return res.json({
      ok: true,
      SaldotransDB: result
    });
  } catch (error) {
    console.log('ERROR EN BKTRANALLHOMME:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Hable con el administrador..',
      error: error.message
    });
  }
};

const bkhistoricotranspagosGENERAL = async (req, res = response) => {
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
      `SELECT a.id, a.zona, a.idadmin, a.fecha, a.monto, a.codtrans,
              a.detalle, a.idcasa, b.descripcion, c.nombre, c.apellido, x.casa,
              MONTH(a.fecha) AS mes,
              ${monthNameCase('a.fecha')} AS mesnombre,
              YEAR(a.fecha) AS year
       FROM transaccion a
       JOIN codtrans b ON a.codtrans = b.id
       JOIN usuario c ON a.idadmin = c.id
       JOIN casa x ON a.idcasa = x.id
       WHERE a.zona = ?
         AND a.codtrans IN (1, 4)
         ${filtroFecha.clause}
       ORDER BY a.fecha DESC`,
      [zona, ...filtroFecha.params]
    );

    return res.json({
      ok: true,
      PagostransDB: result
    });
  } catch (error) {
    console.log('ERROR EN BKHISTORICOTRANSPAGOSGENERAL:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Hable con el administrador..',
      error: error.message
    });
  }
};

const bkprocesarcargomensual = async (req, res = response) => {
  const auth = ensureAdmin(req, res);
  if (!auth) {
    return;
  }

  const zona = req.body?.zona;
  const fecha = req.body?.fecha;
  const requestedAdminId = req.body?.idadmin;
  const idadmin = requestedAdminId !== undefined && requestedAdminId !== null && requestedAdminId !== ''
    ? Number(requestedAdminId)
    : Number(auth.tokenUserId);

  if (!Number.isInteger(idadmin) || idadmin <= 0) {
    return res.status(400).json({
      ok: false,
      msg: 'El idadmin es obligatorio y debe ser válido'
    });
  }

  if (Number(idadmin) !== Number(auth.tokenUserId)) {
    return res.status(403).json({
      ok: false,
      msg: 'El idadmin no coincide con el usuario autenticado'
    });
  }

  try {
    const result = await processMonthlyCharges({
      targetDate: fecha,
      zona,
      adminId: idadmin
    });

    return res.json({
      ok: true,
      msg: 'Proceso mensual ejecutado correctamente',
      cronMensualDB: result
    });
  } catch (error) {
    console.log('ERROR EN BKPROCESARCARGOMENSUAL:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Error al ejecutar el cargo mensual',
      error: error.message
    });
  }
};

module.exports = {
  bkhistoricotranspagosGENERAL,
  bkfiltropago,
  bkcodtrans,
  bkcodtransgasto,
  bkinsertransanualidad,
  bkinsertranscuota,
  bkhistoricotranspagos,
  bktransaldo,
  bkresumensaldocasa,
  bktransaldousuario,
  bktranvalidacionanualidad,
  bktranallhomme,
  bkprocesarcargomensual
};
