
const { response } = require('express');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const { generarJWT } = require('../helpers/jwt');
const { metodousuarioVerificado } = require('../controllers/mail');
const sql = require('../models/connection_models');
//const Usuario =require('../models/usuario');
//const casamodel =require('../models/casa');

const dbQuery = promisify(sql.query).bind(sql);

const bklogin = async (req, res = response) => {
  let body = req.body;
  let user = body.usuario;
  let pass = body.pass;
  let userdata = [];

  console.log('BKLOGIN - Usuario recibido:', user);

  try {
    if (!user || !pass) {
      return res.status(400).json({
        ok: false,
        msg: 'Debe enviar usuario y pass'
      });
    }

    const dbUser = await dbQuery(`
      SELECT a.id, a.roll, a.idcodcalle, a.casa, a.nombre, a.apellido,
             a.correo, a.telefono, a.usuario, a.pass, b.casa as casa_nombre, 
             b.id as idcasa, c.nombrecalle, c.sector, c.barriada, a.status, 
             c.idtop, c.estado
      FROM usuario a
      LEFT JOIN casa b ON a.casa = b.id
      LEFT JOIN calle c ON a.idcodcalle = c.idcodcalle
      WHERE a.usuario = ?
      LIMIT 1
    `, [user]);

    if (!dbUser || dbUser.length === 0) {
      return res.status(400).json({
        ok: false,
        msg: 'Credenciales incorrectas'
      });
    }

    // Verificar contraseña
    if (pass !== dbUser[0].pass) {
      return res.status(400).json({
        ok: false,
        msg: 'Credenciales incorrectas'
      });
    }

    // Verificar status del usuario
    if (dbUser[0].status != 2) {
      metodousuarioVerificado(user, dbUser[0].id, dbUser[0].nombre, 'Account Control');

      return res.json({
        ok: false,
        msg: "Te enviaremos un enlace a tu correo electrónico, para que confirmes."
      });
    }

    // Generar JWT
    // const { token, exp } = await generarJWT(user);


    const payload = {
  id: dbUser[0].id  ,
  user: dbUser[0].usuario,
  role: dbUser[0].roll, // o role normalizado
};

const token = jwt.sign(payload, process.env.JWT_KEY, {
  expiresIn: process.env.JWT_EXP,
});
const decodedToken = jwt.verify(token, process.env.JWT_KEY);
const exp = new Date(decodedToken.exp * 1000);

    // Preparar datos del usuario
    userdata.push({
      "id": dbUser[0].id,
      "roll": dbUser[0].roll,
      "idcodcalle": dbUser[0].idcodcalle,
      "casa": dbUser[0].casa,
      "nombre": dbUser[0].nombre,
      "apellido": dbUser[0].apellido,
      "correo": dbUser[0].correo,
      "telefono": dbUser[0].telefono,
      "usuario": dbUser[0].usuario,
      "idcasa": dbUser[0].idcasa,
      "nombrecalle": dbUser[0].nombrecalle,
      "sector": dbUser[0].sector,
      "barriada": dbUser[0].barriada,
      "status": dbUser[0].status,
      "idtop": dbUser[0].idtop,
      "estado": dbUser[0].estado,
    });

    return res.json({
      ok: true,
      userdata,
      token,
      exp
    });

  } catch (error) {
    console.log('ERROR EN BKLOGIN:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Hable con el administrador..',
      error: error.message
    });
  }
}


const renewToken = async (req, res = response) => {
  let body = req.body;
  let user = body.user;
  let pass = body.pass;
  let userdata = [];

  try {
    const dbUser = await dbQuery(`
      SELECT a.id, a.roll, a.idcodcalle, a.casa, a.nombre, a.apellido,
             a.correo, a.telefono, a.usuario, a.pass, b.casa as casa_nombre, 
             b.id as idcasa, c.nombrecalle, c.sector, c.barriada, a.status, 
             c.idtop, c.estado
      FROM usuario a
      LEFT JOIN casa b ON a.casa = b.id
      LEFT JOIN calle c ON a.idcodcalle = c.idcodcalle
      WHERE a.usuario = ? AND a.pass = ?
    `, [user, pass]);

    if (!dbUser || dbUser.length === 0) {
      return res.status(400).json({
        ok: false,
        msg: 'Credenciales incorrectas'
      });
    }

    const token = await generarJWT(user);

    userdata.push({
      "id": dbUser[0].id,
      "roll": dbUser[0].roll,
      "idcodcalle": dbUser[0].idcodcalle,
      "casa": dbUser[0].casa,
      "nombre": dbUser[0].nombre,
      "apellido": dbUser[0].apellido,
      "correo": dbUser[0].correo,
      "telefono": dbUser[0].telefono,
      "usuario": dbUser[0].usuario,
      "idcasa": dbUser[0].idcasa,
      "nombrecalle": dbUser[0].nombrecalle,
      "sector": dbUser[0].sector,
      "barriada": dbUser[0].barriada,
      "status": dbUser[0].status,
      "idtop": dbUser[0].idtop,
      "estado": dbUser[0].estado,
    });

    return res.json({
      ok: true,
      userdata,
      token
    });

  } catch (error) {
    console.log('ERROR EN RENEWTOKEN:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Hable con el administrador..',
      error: error.message
    });
  }
}

const bkAdminPhAccess = async (req, res = response) => {
  const iduser = req.body?.id;
  const tokenRole = req.auth?.role;
  const tokenUserId = req.auth?.id;
  const isAdmin = String(tokenRole).toLowerCase() === 'admin' || String(tokenRole) === '1';

  if (!isAdmin) {
    return res.status(403).json({
      ok: false,
      msg: 'No tiene permisos de administrador'
    });
  }

  if (!iduser || !Number.isInteger(Number(iduser))) {
    return res.status(400).json({
      ok: false,
      msg: 'Debe enviar iduser válido'
    });
  }

  if (!tokenUserId || Number(iduser) !== Number(tokenUserId)) {
    return res.status(403).json({
      ok: false,
      msg: 'El iduser no coincide con el usuario autenticado'
    });
  }

  try {
    const PhAccessDB = await dbQuery(
      `select a.idcalle, c.barriada From admin_php_access a 
      left join calle c on c.idcodcalle = a.idcalle 
       WHERE iduser = ?
       ORDER BY a.idcalle ASC`,
      [Number(iduser)]
    );

    return res.json({
      ok: true,
      PhAccessDB
    });
  } catch (error) {
    console.log('ERROR EN BKADMINPHACCESS:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Hable con el administrador..',
      error: error.message
    });
  }
}





module.exports = {
  bklogin,
  renewToken,
  bkAdminPhAccess
}
