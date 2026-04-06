const cron = require('node-cron');
const {
  DEFAULT_ADMIN_ID,
  DEFAULT_TIME_ZONE,
  getDatePartsInTimeZone,
  processMonthlyCharges
} = require('../services/monthly-charges');

let lastProcessedMonth = null;

const runMonthlyChargesIfNeeded = async () => {
  const { year, month, day } = getDatePartsInTimeZone(new Date(), DEFAULT_TIME_ZONE);

  if (day !== '01') {
    return;
  }

  const monthKey = `${year}-${month}`;
  if (lastProcessedMonth === monthKey) {
    return;
  }

  try {
    const result = await processMonthlyCharges({
      targetDate: `${monthKey}-01`,
      adminId: DEFAULT_ADMIN_ID,
      timeZone: DEFAULT_TIME_ZONE
    });

    lastProcessedMonth = monthKey;
    console.log('[monthly-charges] Proceso mensual ejecutado:', {
      fecha: result.fecha,
      total_calles: result.total_calles,
      total_insertados: result.total_insertados
    });
  } catch (error) {
    console.error('[monthly-charges] Error ejecutando el proceso mensual:', error.message);
  }
};

const startMonthlyChargesJob = () => {
  runMonthlyChargesIfNeeded();
  cron.schedule('0 0 1 * *', runMonthlyChargesIfNeeded, {
    timezone: DEFAULT_TIME_ZONE
  });
};

module.exports = {
  startMonthlyChargesJob
};
