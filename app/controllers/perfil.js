
const { response } = require('express');
const db = require('../config/connection');

const bkperfil = async (req, res = response) => {
    const idFromRequest = req.body.id;
    const tokenUser = req.auth?.user;

console.log('tokenUser:', tokenUser);
console.log('idFromRequest:', idFromRequest);

    if (!idFromRequest) {
        return res.status(400).json({
            ok: false,
            msg: 'Debe enviar el id del usuario'
        });
    }

    const userId = Number(idFromRequest);
    if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(400).json({
            ok: false,
            msg: 'El id del usuario no es valido'
        });
    }

    if (!tokenUser) {
        return res.status(401).json({
            ok: false,
            msg: 'Token invalido: no contiene usuario'
        });
    }

    try {
        const result = await db.query(
            `SELECT id, nombre, apellido, correo, telefono, casa, roll
             FROM usuario
             WHERE id = $1 AND usuario = $2
             LIMIT 1`,
            [userId, tokenUser]
        );

        if (!result.rows || result.rows.length === 0) {
            return res.status(403).json({
                ok: false,
                msg: 'El id no corresponde al usuario del token'
            });
        }

        const perfil = result.rows[0];

        return res.json({
            ok: true,
            perfil
        });
    } catch (error) {
        console.log('ERROR EN BKPERFIL:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Hable con el administrador..',
            error: error.message
        });
    }
};

module.exports = {
    bkperfil
};
