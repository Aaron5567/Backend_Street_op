const { dbQuery } = require('../helpers/mysql-utils');

const DEFAULT_TIME_ZONE = process.env.MONTHLY_CHARGE_TIMEZONE || 'America/Panama';
const DEFAULT_ADMIN_ID = Number(process.env.MONTHLY_CHARGE_ADMIN_ID || 1);
const DETAIL_LABEL = process.env.MONTHLY_CHARGE_DETAIL || 'Anualidad';
const CODTRANS_MONTHLY_CHARGE = 2;

const getDatePartsInTimeZone = (date = new Date(), timeZone = DEFAULT_TIME_ZONE) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return { year, month, day };
};

const getCurrentMonthStart = (timeZone = DEFAULT_TIME_ZONE) => {
  const { year, month } = getDatePartsInTimeZone(new Date(), timeZone);
  return `${year}-${month}-01`;
};

const normalizeTargetDate = (targetDate, timeZone = DEFAULT_TIME_ZONE) => {
  if (!targetDate) {
    return getCurrentMonthStart(timeZone);
  }

  if (typeof targetDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    throw new Error('La fecha debe tener formato YYYY-MM-DD');
  }

  return `${targetDate.slice(0, 7)}-01`;
};

const getCalles = async (zona) => {
  if (zona !== undefined && zona !== null && zona !== '') {
    return dbQuery(
      `SELECT idcodcalle, numhome, mensualidad
       FROM calle
       WHERE idcodcalle = ?
       ORDER BY idcodcalle ASC`,
      [zona]
    );
  }

  return dbQuery(
    `SELECT idcodcalle, numhome, mensualidad
     FROM calle
     ORDER BY idcodcalle ASC`
  );
};

const getResumenMensual = async (zona, fecha) => {
  const result = await dbQuery(
    `SELECT COUNT(a.id) AS cantidad_mensual,
            SUM(a.monto) AS cargo_mensual,
            b.numhome,
            (b.numhome * b.mensualidad) AS monto_cargo
     FROM calle b
     LEFT JOIN transaccion a
       ON a.zona = b.idcodcalle
      AND a.codtrans = ?
      AND a.fecha = ?
     WHERE b.idcodcalle = ?
     GROUP BY b.numhome, b.mensualidad`,
    [CODTRANS_MONTHLY_CHARGE, fecha, zona]
  );

  return result[0] || null;
};

const getCasasSinCargo = async (zona, fecha) => dbQuery(
  `SELECT c.id
   FROM casa c
   LEFT JOIN transaccion t
     ON t.idcasa = c.id
    AND t.zona = c.idcodcalle
    AND t.codtrans = ?
    AND t.fecha = ?
   WHERE c.idcodcalle = ?
     AND t.id IS NULL
   ORDER BY c.id ASC`,
  [CODTRANS_MONTHLY_CHARGE, fecha, zona]
);

const insertMonthlyCharges = async ({ zona, fecha, idadmin, monto, casas }) => {
  if (!casas.length) {
    return { affectedRows: 0 };
  }

  const values = casas.flatMap((casa) => [
    zona,
    idadmin,
    fecha,
    monto,
    CODTRANS_MONTHLY_CHARGE,
    DETAIL_LABEL,
    casa.id
  ]);

  const placeholders = casas.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');

  return dbQuery(
    `INSERT INTO transaccion
     (zona, idadmin, fecha, monto, codtrans, detalle, idcasa)
     VALUES ${placeholders}`,
    values
  );
};

const processMonthlyCharges = async ({ targetDate, zona, adminId, timeZone = DEFAULT_TIME_ZONE } = {}) => {
  const fecha = normalizeTargetDate(targetDate, timeZone);
  const idadmin = Number(adminId || DEFAULT_ADMIN_ID);

  if (!Number.isInteger(idadmin) || idadmin <= 0) {
    throw new Error('El id del administrador para el cron no es válido');
  }

  const calles = await getCalles(zona);
  const resultados = [];
  let totalInsertados = 0;

  for (const calle of calles) {
    const idcodcalle = Number(calle.idcodcalle);
    const monto = Number(calle.mensualidad || 0);
    const resumen = await getResumenMensual(idcodcalle, fecha);
    const casasSinCargo = await getCasasSinCargo(idcodcalle, fecha);

    const cantidadMensual = Number(resumen?.cantidad_mensual || 0);
    const cargoMensual = resumen?.cargo_mensual === null || resumen?.cargo_mensual === undefined
      ? null
      : Number(resumen.cargo_mensual);

    if (!casasSinCargo.length) {
      resultados.push({
        zona: idcodcalle,
        fecha,
        estado: 'ya_cargado',
        cantidad_mensual: cantidadMensual,
        cargo_mensual: cargoMensual,
        casas_insertadas: 0
      });
      continue;
    }

    await insertMonthlyCharges({
      zona: idcodcalle,
      fecha,
      idadmin,
      monto,
      casas: casasSinCargo
    });

    totalInsertados += casasSinCargo.length;
    resultados.push({
      zona: idcodcalle,
      fecha,
      estado: cantidadMensual === 0 || cargoMensual === null ? 'cargado' : 'completado_parcial',
      cantidad_mensual: cantidadMensual,
      cargo_mensual: cargoMensual,
      casas_insertadas: casasSinCargo.length,
      casas_ids: casasSinCargo.map((casa) => casa.id)
    });
  }

  return {
    fecha,
    zona: zona || null,
    idadmin,
    total_calles: calles.length,
    total_insertados: totalInsertados,
    resultados
  };
};

module.exports = {
  DEFAULT_ADMIN_ID,
  DEFAULT_TIME_ZONE,
  getCurrentMonthStart,
  getDatePartsInTimeZone,
  processMonthlyCharges
};
