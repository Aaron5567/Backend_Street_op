const { response } = require('express');
const { dbQuery, isAdminRole } = require('../helpers/mysql-utils');

const ensureAdmin = (req, res) => {
  const tokenRole = req.auth?.role;
  const isAdmin = isAdminRole(tokenRole);

  if (!isAdmin) {
    res.status(403).json({
      ok: false,
      msg: 'No tiene permisos de administrador'
    });
    return null;
  }

  return { tokenRole, isAdmin };
};

const bkgraficamensualgasto = async (req, res = response) => {
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
      `SELECT YEAR(fecha) AS year,
       MONTH(fecha) AS mes,
       SUM(monto) AS monto,
       MONTH(fecha) AS position
FROM historicogastos
WHERE idzona = ?
  AND YEAR(fecha) >= YEAR(CURDATE()) - 1
  AND YEAR(fecha) <= YEAR(CURDATE())
GROUP BY YEAR(fecha), MONTH(fecha)
ORDER BY YEAR(fecha) ASC, MONTH(fecha) ASC`,
      [zona]
    );

    return res.json({
      ok: true,
      GraficamensualgastoDB: result
    });
  } catch (error) {
    console.log('ERROR EN BKGRAFICAMENSUALGASTO:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Hable con el administrador..',
      error: error.message
    });
  }
};

const bkgraficanualgasto = async (req, res = response) => {
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
      `SELECT YEAR(fecha) AS year, SUM(monto) AS monto
       FROM historicogastos
       WHERE idzona = ?
         AND YEAR(fecha) >= YEAR(CURDATE()) - 1
         AND YEAR(fecha) <= YEAR(CURDATE())
       GROUP BY YEAR(fecha)
       ORDER BY YEAR(fecha) ASC`,
      [zona]
    );

    return res.json({
      ok: true,
      GraficamensualgastoDB: result
    });
  } catch (error) {
    console.log('ERROR EN BKGRAFICANUALGASTO:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Hable con el administrador..',
      error: error.message
    });
  }
};

const bkgrafporcpago = async (req, res = response) => {
  const zona = req.body?.zona;
  const casa = req.body?.casa;
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
      `SELECT
         COALESCE(SUM(CASE WHEN a.codtrans IN (2) THEN a.monto * b.saldo ELSE 0 END), 0) AS anualidad,
         COALESCE(SUM(CASE WHEN a.codtrans IN (1, 4) THEN a.monto * b.saldo ELSE 0 END), 0) AS pagos
       FROM transaccion a
       LEFT JOIN codtrans b ON b.id = a.codtrans
       WHERE a.zona = ?
         AND a.idcasa = ?`,
      [zona, Number(casa)]
    );

    return res.json({
      ok: true,
      GrafporcpagoDB: result
    });
  } catch (error) {
    console.log('ERROR EN BKGRAFPORCPAGO:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Hable con el administrador..',
      error: error.message
    });
  }
};

module.exports = {
  bkgrafporcpago,
  bkgraficamensualgasto,
  bkgraficanualgasto
};
