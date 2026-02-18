const { response } = require('express');
const sql = require('../models/connection_models');

var FCM = require('fcm-node');
const { parse } = require('dotenv');

var serverKey = 'AAAA5H7iPbs:APA91bGDSfanvxouar8qguuzy1d-U3OfC0Wn9Zhz-Ba7f6RfZLfHx_L2tuDUs2-DFkEteSY-ZSzmJR4MxeQ4OZyZdKhwIyCHR0cwqR7FopEzouTtgOKaLLabSx-hApT6or_jdlggVvlH'; //put your server key here
var fcm = new FCM(serverKey);

const notificacionpagos = (monto,idcasa) => {

    try{
        
        return new Promise((resolve, reject)=>{

        sql.query(`
         SELECT device FROM usuario a
         LEFT join pushnotification p on p.email = a.correo
         where casa = ${idcasa} and p.estado = 1
        `, (error, pushDb) => {
            if (error) { 
            return console.log(error)
            }
           
            if(pushDb == "" ){
             return console.log('No hay usuario vinculado')
            }
            
            if(pushDb[0]['device'] == null ){
              console.log('no hay dispositivo asociados');
              return  reject({ msg: 'no hay dispositivo asociados'})
            }

            var array = [];
            for(var i = 0 ; i < pushDb.length; i+=1){
                var xx = array.push(pushDb[i]['device']);
            }

            var devicearray = (array);
           
            
            const regitrationTokens = devicearray 

            var message = { 
                
                
                registration_ids : regitrationTokens,
                
                notification: {
                    title: 'AppStreet', 
                    body: `Se ha registrado un pago de $${monto}` 
                },
    
                "data": {
                   pago: `Se ha registrado un pago de $${monto} ,verifique su estodo de cuenta.`
                },

              
             
            };
            
            // fcm.send(message, function(err, response){
               
            //     if (err) {
            //        //console.log("Something has gone wrong!");
            //     reject({ msg: err})
            //     } else {
            //         console.log("Successfully sent with response: ", response);
            //       resolve({ msg: 'Successfully pushnotification'})
            //     }
            // });
  fcm.send(message, function(err, response){
               
                if (err) {
                   //console.log("Something has gone wrong!");
                   console.log(err[0].failure)
                reject({ msgerr: err})
                } else {
                    console.log("Successfully sent with response: ", response);
                  resolve({ msg: 'Successfully pushnotification'})
                }
            });

          
            
        });
    })
    
    }catch(e){
        next(e)
    }

  
}


const registrarDevice = async (req, res = response) => {

    let body = req.body;
    let device = body.device;
    let email  = body.email;
    let estado = body.estado;
    let estadoinactivo = body.estadoinactivo;
    let zona = body.zona;
    
    
    try{


        if(!device){
            return res.json(
            { ok:false,
              msg: 'no hay dispositivo'
            }
            )
        }    
      
            sql.query(`
            INSERT INTO pushnotification(device, email, estadoinactivo, estado, zona) 
            VALUES ('${device}','${email}',${estadoinactivo},${estado},'${zona}')
            `, (error, suscripcion) => {
                if (error) { 
                return  res.json({
                    ok: false,
                    msg : error
                  })
                }

                res.json({
                    ok: true,
                    suscripcion
                })
                
            });
    }catch(e){
        res.json({
            ok: false,
            msg: 'Hable con el Administrador'
        })
    }

}

const push = async (req, res = response) => {

    var serverKey = 'AAAA5H7iPbs:APA91bGDSfanvxouar8qguuzy1d-U3OfC0Wn9Zhz-Ba7f6RfZLfHx_L2tuDUs2-DFkEteSY-ZSzmJR4MxeQ4OZyZdKhwIyCHR0cwqR7FopEzouTtgOKaLLabSx-hApT6or_jdlggVvlH'; //put your server key here
    var fcm = new FCM(serverKey);
    
    try{
        var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
            registration_ids: [
                "fIXt6cPyfUMSrpS6ltjeXs:APA91bGuN73CXjmuA553lBk3wivmmWcbQKWh1Lfo7h3af2uenTTXYdS8c7XDcmcr515IxOLHcUaIQRDiPxkMU07_c_SbAvKj7H3xu2wj3yIhp9EvrDr6Ck5Ltn8MrTBSYcJNh-xIgdpU"
                // ,"eJ7gpNyYWUQolsFFPoOEGa:APA91bGig_9xAVbpgcbJawqiq-PcdCyEWmcCul0_JLSjNhZ-0E93P7bmhbN-qfB7GhCDyx7_dwChs5xLX-0iLa2tm4lea_q6xgllS-JCEFlhN8O4cZgfMScZPn5__lb5fqs5PsqRGrKn"
                
            ], 
           
            
            notification: {
                title: 'AppStreet', 
                body: 'Mensaje de prueba' 
            },


  
            "data": {
               pago: 'adrian pago'
            }
         
        };

        
        fcm.send(message, function(err, response){

        
           
            
            if (err) {
                let arrayerr = [];
                arrayerr.push(JSON.parse(err))
                console.log( arrayerr[0]);
                console.log( arrayerr[0]['failure']);
                console.log("Something has gone wrong!");
                if(arrayerr[0]['failure'] > 0 ){
                    const failedTokens = [];

                    // arrayerr['results'].forEach((resp, idx) => {
                        // console.log(resp);
                    //   if (!resp.success) {
                    //     failedTokens.push(registrationTokens[idx]);
                    //   }
                    // });
                    // console.log('List of tokens that caused failures: ' + failedTokens);
                }
                res.json({
                    ok:false,
                    msg : err
                })
            } else {
                console.log("Successfully sent with response: ", response);
                res.json({
                    ok:true,
                    msg : response
                })
            }
        });


//         getMessaging().sendMulticast(message)
//   .then((response) => {
//     if (response.failureCount > 0) {
//       const failedTokens = [];
//       response.responses.forEach((resp, idx) => {
//         if (!resp.success) {
//           failedTokens.push(registrationTokens[idx]);
//         }
//       });
//       console.log('List of tokens that caused failures: ' + failedTokens);
//     }
//   });
    
        
    }catch(e){
        console.log(e);
    }
  


}

const selectDevice = async (req, res = response) => {
    let body = req.body;
    let device = body.device;

    try {

        if(!device){
            return res.json(
            { ok:false,
              msg: 'no hay dispositivo'
            })
        }    

        sql.query(`
        select * from pushnotification where device = '${device}'
        `, (error, selectDevice) => {
            if (error) { 
            return  res.json({
                ok: false,
                msg : error
              })
            }

            res.json({
                ok: true,
                selectDevice
            })
            
        });
        
        
    } catch (error) {
        res.json({
            ok: false,
            msg: 'Hable con el Administrador Select Deviced'
        })
    }

}

const  deleteDevice = async (req, res = response) => {
    let body = req.body;
    let device = body.device;

    try {

        if(!device){
            return res.json(
            { ok:false,
              msg: 'no hay dispositivo'
            })
        }    

        sql.query(`
        delete from pushnotification where device = '${device}'
        `, (error, deleteDevice) => {
            if (error) { 
            return  res.json({
                ok: false,
                msg : error
              })
            }
           
             if(deleteDevice.affectedRows > 0){
                res.json({
                    ok: true,
                })
             }else{
                res.json({
                    ok: false,
                })
             }
           
            
        });
        
        
    } catch (error) {
        res.json({
            ok: false,
            msg: 'Hable con el Administrador Select Deviced'
        })
    }

}

const  viewnotificacion = async (req, res = response) =>   {
    let body  = req.body;
    let email = body.email;

    console.log(email)

    try {

            sql.query(`SELECT  * from notificacion where correo = '${email}'
            `, (error, Notificacion) => {
                if (error) { console.error(error) }
               

                
                if(Notificacion == ""){
                    return res.json({
                        ok: false,
                        msg : "No hay notificaciones"
                    })
                }else{
                    return res.json({
                        ok: true,
                        Notificacion
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

module.exports = {
    push,
    notificacionpagos,
    registrarDevice,
    selectDevice,
    deleteDevice,
    viewnotificacion
    
}