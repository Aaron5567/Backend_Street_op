
const { response } = require('express');
const sql = require('../models/connection_models');

var datetime = require('node-datetime');



const bkcreateuser = async (req, res = response) => {

    var resultaGlobal;

    let body = req.body;
    let zona = body.zona
    let idcasa = body.idcasa
    let nombre = body.nombre
    let apellido = body.apellido
    let telefono = body.telefono
    let correo = body.correo
    let usuario = body.usuario
    let pass = body.pass 
    let roll = body.roll
    let status = 1;

   
    let  fechacreate = datetime.create(new Date());
    var dt =  fechacreate.format('Y-m-d');

    try {

        const veficar_existe =

            sql.query(`INSERT INTO usuario
            (idcodcalle, casa, nombre, apellido, correo, telefono, usuario, pass, roll,status,createdAt) 
            VALUES (  ${zona},'${idcasa}','${nombre}','${apellido}','${correo}','${telefono}','${usuario}' ,'${pass}','${roll}', ${status} , '${dt}')
            `, (error, UsuariosDB) => {
                if (error) { 
                   
                    return res.status(500).json({
                      ok:false,
                      msg: 'Error al registrar el Usuario'
                    })
                   }


                   if(UsuariosDB.affectedRows > 0 ){
                    return res.json({
                      ok: true,
                      msg : 'El Usuario fue creado correctamente'
                    //  TransgastoDB
                  }); 
                  }else{
                    return res.json({
                      ok: false,
                      msg : 'No se registro la información del Usuario'
                  }); 
                  }


            });


    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            msg: 'Hable con el administrador'
        });

    }


}

const bkusuarios = async (req, res = response) => {

    var resultaGlobal;

    let body = req.body;
    let zona = body.zona
   


    try {

        const veficar_existe =

            sql.query(`SELECT a.id,a.roll,a.idcodcalle,a.casa,a.nombre,a.apellido,
            a.correo,a.telefono,a.usuario,a.pass,b.casa,b.id as idcasa,c.nombrecalle,
            c.sector,c.barriada,a.status, c.idtop
            FROM usuario a ,casa b , calle c
            where a.idcodcalle = c.idcodcalle
            and a.casa = b.id 
            and a.idcodcalle = '${zona}' 
            order by a.casa  ASC
            `, (error, UsuariosDB) => {
                if (error) { console.error(error) }



                return res.json({
                    ok: false,
                    UsuariosDB


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


const bkdeleteuser = async (req, res = response) => {

    let body = req.body;
    let zona = body.zona
    let iduser = body.iduser
  
    try {


            sql.query(`Delete from usuario where idcodcalle = '${zona}'
            and id = ${iduser}
            `, (error, UsuariosdeleteDB) => {
                if (error) { console.error(error) }
                return res.json({
                    ok: false,
                    UsuariosdeleteDB
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


const bkrewpass = async (req, res = response) => {

    var resultaGlobal;

    let body = req.body;
    let zona = body.zona
    let iduser = body.iduser
    let pass = body.pass
  
   

    try {


            sql.query(`Update  usuario set pass = '${pass}' ,status = 1
            where idcodcalle =  '${zona}'
            and id = ${iduser}
            `, (error, UsuarioupdateDB) => {
                if (error) { console.error(error) }
                return res.json({
                    ok: false,
                    UsuarioupdateDB
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


// cambiar informacion del usuario
const updateuser = async (req, res = response )=> {

    let body = req.body;
    let nombre   = body.nombre
    let apellido = body.apellido
    let telefono = body.telefono
    let email    = body.email
  
    try {
            sql.query(`update  usuario set nombre = '${nombre}',
            apellido = '${apellido}' , telefono = '${telefono}'  where 
            correo = '${email}'
            `, (error, Updateuser) => {
                if (error) { console.error(error) }
          
                if(Updateuser.affectedRows > 0){
                    return res.json({
                        ok: true,
                        msg : "Se realizo el cambio de usuario"
                    });
                }else{
                    return res.json({
                        ok: false,
                        msg : "Ocurrio un error al realizar el cambio de usuario"
                    });
                }
              
            });


    } catch (error) {
       
        return res.status(500).json({
            ok: false,
            msg: 'Hable con el administrador'
        });

    }
}

module.exports = {
    bkusuarios,
    bkcreateuser,
    bkdeleteuser,
    bkrewpass,
    updateuser
    
}