const { promisify } = require('util');
const sql = require('../models/connection_models');

const dbQuery = promisify(sql.query).bind(sql);

const isAdminRole = (role) => String(role).toLowerCase() === 'admin' || String(role) === '1';

module.exports = {
  dbQuery,
  isAdminRole
};
