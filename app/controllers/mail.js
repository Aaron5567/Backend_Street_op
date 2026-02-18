
const{response} = require('express');
const nodemailer = require("nodemailer");
const { generarJWTValuser } = require('../helpers/jwt');
const sql = require('../models/connection_models');

var datetime = require('node-datetime');


const mailcontactenos =  async  (req, res = response) => {

let body         = req.body;
let nombre       = body.nombre;
let email        = body.email;
let comentario   = body.comentario;
let nombreuser   = body.nombreuser;
let apellido     = body.apellido;
let calle        = body.calle;
let barriada     = body.barriada;


let transporter = nodemailer.createTransport({
 
    // host: 'smtp.gmail.com',
    host: "mail.privateemail.com",
    port : 465,
    auth: {
      user: "solution@a3syscom.com", 
      pass: "Acuarioagua1991.", 
    },
  });
  

//   .fila0 { background:rgba(162, 162, 162,0.2); }
//   .fila1 { background:rgba(169,191,255,0.2); }
  let sendhtl = ( 
      `
    <!DOCTYPE html>
    <html lang="en" >
      <head>
      <title> A3SYSCOM </title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      
      <style>

      html, body { 
        height:100%; 
      }
      
      .contenedor{
        height: 80%;
        margin: 1% 1%;
      }
    
    * {
      box-sizing: border-box;
    }

    .type-1 {
        border-radius:10px;
        border: 1px solid #eee;
        transition: .3s border-color;
      }
      .type-1:hover {
        border: 1px solid #aaa;
      }

      input {
        display:block;
        width:100%;
        margin:10px 0;
        padding:10px;
      }

      textarea {
        width: 100%;
        padding: 12px 20px;
        box-sizing: border-box;
        border: 2px solid #ccc;
        border-radius: 4px;
        background-color: #f8f8f8;
        font-size: 16px;
        resize: none;
      }
    
      </style>
      </head>
      <body>

    <div class="contenedor">
     <h2> A3SYSCOM </h2>

     <h3> Favor dar respuesta  lo antes posible al usuario </h3>
    <h3> Responder al correo : ${email} </h3>
    <div class ="fila0">
     <label >Usuario:</label>
     <textarea  rows="2"  disabled>  ${nombre} </textarea>
   
      <label >Email:</label>
      <input type="email"  class="type-1 " value = ${email} disabled>
   
      <label >Comentario</label>
      <textarea  rows="5"  disabled>  ${comentario} </textarea>
    </div>
   
  


   <div class ="fila1">
   <h3> Información del Usuario Logeado </h3>
    <label >Usuario logeado:</label>
    <input type="text" class="type-1 "  value = "${nombreuser} ${apellido}"  disabled>
  
     <label >Calle:</label>
     <textarea  rows="2"  disabled>  ${calle} </textarea>
  
     <label >Barriada:</label>
     <textarea  rows="2"  disabled>  ${barriada} </textarea>
   </div>

   </div

      </body>
    </html>`
      
    );


  let info = await transporter.sendMail({
    from: `solution@a3syscom.com `,
    to: `solution@a3syscom.com`,
    subject: `Account Control`,
    text: `usuario ${nombre}`,
    // html:  `<b> Correo : ${email} - ${comentario}</b>`,
    html: sendhtl
   
  });



res.json({
    ok: true,
 //    info
})

}

const metodousuarioVerificado  =  async (email,iduser,nombre,app) => {


  const token = await generarJWTValuser(iduser);

   return new Promise((resolve, reject)=>{
   
   var tokenval = token['token'];
   var expval  = token['exp'];
 
  let transporter = nodemailer.createTransport({
    // service: 'gmail',

    host: "mail.privateemail.com",
    port : 465,
    auth: {
      user: "solution@a3syscom.com", 
      pass: "Acuarioagua1991.", 
    },

  });
{/* <img src="https://3albaspaces.sfo3.digitaloceanspaces.com/Streets/Logo/C75279BB-95F9-4A01-BC4F-B6EFD48E1EF0.png" width="200"  height="200"  alt= "logo"> */}
{/* <button class="button button2" ><a style="text-decoration:none"  href="http://192.168.0.5:3002/stree/api/updateverificadousuario/usuario=aalba" >Confirmar</a></button> */}
// background-color: #008CBA;
  let sendhtl = ( `
  <!DOCTYPE html>
  <html lang="en" >
    <head>
    <title> A3SYSCOM </title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>


.fcc-btn {
  background-color: #008CBA;
  color: black;
  font-weight: bold;
  padding: 15px 25px;
  text-decoration: none;
  display: inline-block;
  border-radius: 30px;
  width: 90px;
  text-align: center;
}


</style>
    </head>
    <body>
   

    <h2> 
    <b><p  align="left">Hola </p></b></h2>
    
    <p align="left"> Gracias por formar parte de nuestra comunidad <b> Account Control  </b> </p>
  

    <p align="left"> Presiona el botón para confirmar su correo electrónico  </p>
    <br>
  
    <a  class="fcc-btn"  style="color:#ffffff;" href="https://a3syscom.com/#/validaciones/validauser/${iduser}/${tokenval}">Confirmar</a> 
    
    <br>
    <p align="left"> Saludos,  </p>
    <p align="left"> Account Control  </p>

    </body>
    </html>
  `
  )

  
  let info =  transporter.sendMail({
    from: `solution@a3syscom.com `,
    to: `${email}  `,
    subject: `Por favor confirme su email ${app}`,
    text: `usuario ${nombre}`,
    html: sendhtl,
  
  });

  resolve( 'Mensaje enviado')

})
}

const usuarioVerificado =  async  (req, res = response) => {

  let body         = req.body;
  let nombre       = body.nombre;

  let iduser       = body.iduser;
  let email        = body.email;
  let app          = body.app;


   const token = await generarJWTValuser(iduser);
   var tokenval = token['token'];
   var expval  = token['exp'];

  //  console.log(tokenval)
  //  console.log(expval)

 
  let transporter = nodemailer.createTransport({
    // service: 'gmail',
    host: "mail.privateemail.com",
    port : 465,
    auth: {
      user: "solution@a3syscom.com", 
      pass: "Acuarioagua1991.", 
    },
  });
{/* <img src="https://3albaspaces.sfo3.digitaloceanspaces.com/Streets/Logo/C75279BB-95F9-4A01-BC4F-B6EFD48E1EF0.png" width="200"  height="200"  alt= "logo"> */}
{/* <button class="button button2" ><a style="text-decoration:none"  href="http://192.168.0.5:3002/stree/api/updateverificadousuario/usuario=aalba" >Confirmar</a></button> */}
// background-color: #008CBA;
  let sendhtl = ( `
  <!DOCTYPE html>
  <html lang="en" >
    <head>
    <title> A3SYSCOM </title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>


.fcc-btn {
  background-color: #008CBA;
  color: white;
  padding: 15px 25px;
  text-decoration: none;
  display: inline-block;
  border-radius: 30px;
  width: 90px;
  text-align: center;
}


</style>
    </head>
    <body>
   

    <h2> 
    <b><p  align="left">Hola </p></b></h2>
    
    <p align="left"> Gracias por formar parte de nuestra comunidad <b> Account Control  </b> </p>
  

    <p align="left"> Presiona el botón para confirmar su correo electrónico  </p>
    <br>
  
    <a  class="fcc-btn"  style="color:#ffffff;" href="http://localhost:4200/#/validaciones/validauser/${iduser}/${tokenval}">Confirmar</a> 
    
    <br>
    <p align="left"> Saludos,  </p>
    <p align="left"> Account Control  </p>

    </body>
    </html>
  `
  )

  
  let info = await transporter.sendMail({
    from: `solution@a3syscom.com `,
    to: `${email}  `,
    subject: `Por favor confirme su email ${app}`,
    text: `usuario ${nombre}`,
    html: sendhtl,
  
  });

  
res.json({
    ok: true,
   msg: 'Mensaje enviado'
})

}


const updateverificadousuario =  async  (req, res = response) => {

  let iduser  = req.body.iduser
  let verificado = '2';

  let  fecha = datetime.create(new Date());

  // var dt = datetime.create('2015-04-30 14:30:00', 'Y/m/d H:I');
  // var formattedDate = dt.format();

    var dt =  fecha.format('Y/m/d');


  try {
       
    sql.query(`Update usuario set status ='${verificado}',updatedAt = '${dt}'
    where  id = ${iduser}
    `, (error, actvefuser) => {
            if (error) { console.error(error) }

            return res.json({
              ok:true,
              msg : 'Solicitud Verificada.'
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


const mailcontacweb = async (req, res = response ) => {
  
  let body         = req.body;
  let name         = body.name;
  let correo       = body.correo;
  let descripcion  = body.descripcion;

  

  let transporter = nodemailer.createTransport({
    // service: 'gmail',
    host: "mail.privateemail.com",
    port : 465,
    auth: {
      user: "solution@a3syscom.com", 
      pass: "Acuarioagua1991.", 
    },
  });


  let senhtml = (`
  <!DOCTYPE html>
  <html lang="en" >
    <head>
    <title> A3SYSCOM </title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>

</style>
    </head>
    <body>
    <img src="https://a3syscom.sfo3.digitaloceanspaces.com/AccountControl/logo/logo/logo_white.png" width="200"  height="200"  alt= "logo">
    
    <h2> Usuario : ${name}  </h2>
    <b><p  align="left">Email : ${correo}  </p></b>
    
    <p align="left"> ${descripcion} .</p>
  
    </body>
    </html>


`);


  let info = await transporter.sendMail({
    from: `solution@a3syscom.com`,
    to: `solution@a3syscom.com`,
    subject: `WeBlog`,
    text: `usuario ${name}`,
    html: senhtml
   
  });



res.json({
    ok: true,
 //    info
})


}

module.exports ={ 
    mailcontactenos,
    usuarioVerificado,
    updateverificadousuario,
    mailcontacweb,
    metodousuarioVerificado
}