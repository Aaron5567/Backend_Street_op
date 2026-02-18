const { response } = require('express');
const sql = require('../models/connection_models');
const db = require('../config/connection');
// const { json } = require('body-parser');
var admin = require("firebase-admin");

 

//hacer select por email enviar titulo ,body ,y data
// app.post('/device/push', function(req, res) {

 const sendpush =  async (monto,idcasa) => {
  try {
    const pushResult = await db.query(
      `SELECT p.device
       FROM usuario a
       LEFT JOIN pushnotification p ON p.email = a.correo
       WHERE a.casa = $1 AND p.estado = 1`,
      [idcasa]
    );

    const registrationTokens = pushResult.rows
      .map((row) => row.device)
      .filter(Boolean);

    if (registrationTokens.length === 0) {
      console.log('No hay usuario vinculado');
      return;
    }

    var serviceAccount = require("./path/to/serviceAccountKey.json");
    function initFirebase() {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    
    if (!admin.apps.length) {
      initFirebase();
    }

    var message = {
      notification: {
        title: 'Account Control',
        body: `Se ha registrado un pago de $${monto}`
      },
      data: {
        pago: `Se ha registrado un pago de $${monto} ,verifique su estodo de cuenta.`
      },
      tokens: registrationTokens,
    };

    const response = await admin.messaging().sendMulticast(message);
    if (response.failureCount > 0) {
      for (let idx = 0; idx < response.responses.length; idx += 1) {
        if (!response.responses[idx].success) {
          await db.query(
            `DELETE FROM pushnotification WHERE device = $1`,
            [registrationTokens[idx]]
          );
        }
      }
    }
  } catch (error) {
    console.log('Error sending message:', error.message);
  }
}
 
const sendpushpago =  (monto,idcalle,msg) => {
  //const sendpushpago = async (req, res = response) => {
              

    return new Promise((resolve, reject)=>{
    sql.query(` SELECT device FROM pushnotification p
    where zona = ${idcalle} and p.estado = 1  `, (err, PushDb) => {
    
        if (err) { 
            return console.log(err)
        }
    
        
    
        if(PushDb == ''){ 
           return console.log('No hay usuario vinculado')
        }
    
    
    
     var array = [];
     for (var i = 0; i < PushDb.length; i+=1) {
    // console.log(PushDb[i]['device']);
       var xx = array.push(PushDb[i]['device']) ;
    } 
      var test =  (array);
      //"ekfhxA-VX0-XiTZ1CQsEMS:APA91bGk4QAn9EiRRlhgJ9WQygFexvdahqwxp4P1Cjm8Su8nVXxoqZm5ZQZYgo3yQLoQ-kw_JqPmEEbrFJeIrsBk3wRAcSEtiGWt-PcMesvg1aUGeTE4Jlo3Trhh_1mH_sd-LUS_0zaU" ;
      //(array);
    
    
    
    
    var serviceAccount = require("./path/to/serviceAccountKey.json");
    function initFirebase() {
        admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
       // databaseURL: "https://pushribasmith.firebaseio.com"
        });
      }
      
      if (!admin.apps.length) {
      initFirebase();
      }
    
    const registrationTokens = test ;
    
    var message = {
          notification: {
            title: 'Account Control', 
            body: `${msg} $${monto} ver histórico de gasto.` 
          },
          data: {
            pago: ` ${msg} $${monto} ver histórico de gasto.`
         },
        //   data: {//you can send only notification or only data(or include both)
        //   my_key: 'my value',
        //   my_another_key: 'my another value',
        //   pagina: '{link}',
        //   click_action: 'FLUTTER_NOTIFICATION_CLICK'
        //   },
          tokens: registrationTokens,
    
    };
    
    
    admin.messaging().sendMulticast(message)
    .then((response) => {
    if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        sql.query(`DELETE FROM pushnotification WHERE device ='${registrationTokens[idx]}'  `, (err, DeleteToken) => {
            if (err) { 
                return console.log(err)
            }
        })
        //    failedTokens.push(registrationTokens[idx]);
         }
       });
        //  console.log(`List of tokens that caused failures: ` +  failedTokens);
       
       
    }
    
    })
    .catch((error) => {
        console.log('Error sending message:');
      });
    
    });
    
    
    array = [];
    
    })
    }
  




module.exports = {  sendpush,
  sendpushpago }
