const { Router } = require('express');

const {  validarJWT , validarJWTUser } = require('../middleware/validar-jwt');

const {
    bklogin,renewToken,bkAdminPhAccess
} = require('../controllers/administrador');
const {
    bkperfil
} = require('../controllers/perfil');


const {
    bkhistoricopagos
} = require('../controllers/pagos');

const { bkusuarios, bkcreateuser, bkdeleteuser, bkrewpass, updateuser
} = require('../controllers/usuarios');
const {
    bkgastos,
    bkfiltroyeargasto,
    bkOPgastos,
    bkOPgastosinsert,
    bkinsertgastosector,
    bkpagoinsert,
    bkpdfresumengasto
} = require('../controllers/gastos');


const {
    bkanualidad, factutraemitida
} = require('../controllers/anualidad');

const {
    bkupdatemensualidad,
    bkcalle,
    bkinserthome,
    bkhome,bkhomeSEARCH,
    bkhomegettodo,
    bkidtophome,
    bkupdatenamehome,
    bkSEARCHUSUARIO
   
} = require('../controllers/home');

const {
    bkinsertransanualidad,
    bkinsertranscuota,
    bkhistoricotranspagos,
    bktransaldo,
    bktransaldousuario,
    bktranvalidacionanualidad,
    bkcodtrans,
    bkcodtransgasto,
    bktranallhomme,
    bkfiltropago,
    bkhistoricotranspagosGENERAL
} = require('../controllers/transaccion');

const {bkgraficamensualgasto,
    bkgraficanualgasto,bkgrafporcpago
}= require('../controllers/graficas')



const { getbanner }= require('../controllers/img');
const { mailcontactenos,usuarioVerificado,updateverificadousuario,mailcontacweb }= require('../controllers/mail');

const { bkinfoempresa }= require('../controllers/infempresa');

const { push,registrarDevice,selectDevice, deleteDevice, viewnotificacion} = require('../controllers/pushnotification');

const { sendpush } = require('../controllers/sendpush');

const {
    bkversion
}= require('../controllers/version')

const router = Router();


//// LOGIN
router.post('/bklogin', bklogin);
router.post('/bkadminphaccess', validarJWT, bkAdminPhAccess);
router.post('/bkperfil', validarJWT, bkperfil);







/////version
router.post('/bkversion', bkversion);

//// INFORMACION DE EMPRESA
router.post('/bkinfoempresa', bkinfoempresa);



////BUSQUEDA
router.post('/bkSEARCHUSUARIO',validarJWT, bkSEARCHUSUARIO);



/////TRANSACCION
router.get('/bkcodtrans'                        , validarJWT, bkcodtrans); // ok visualizar codigo transaccion
router.post('/bkinsertranscuota'                ,  validarJWT,    bkinsertranscuota); //ok registra tranacciones 
router.post('/bktransaldo'                      , validarJWT   , bktransaldo); // ok envio de saldo al usuario
router.post('/bktransaldousuario'               , validarJWT   , bktransaldousuario); // saldo para usuario autenticado
router.get('/bkcodtransgasto'                  , validarJWT, bkcodtransgasto); // oko visualizar codigo transaccion gasto
router.post('/bktranallhomme'                   , validarJWT , bktranallhomme);  //ok mostrar todas las transacciones de todas las casas
router.post('/bkhistoricotranspagos'            , validarJWT, bkhistoricotranspagos);
router.post('/bkfiltropago'                     , validarJWT   , bkfiltropago);// mostrar pagos filtrados por año, últimos 3 meses, últimos 30 días pagados por el usuario autenticado




router.post('/bktranvalidacionanualidad'        , validarJWT ,bktranvalidacionanualidad);
router.post('/bkinsertransanualidad'            , validarJWT  ,bkinsertransanualidad);
router.post('/bkhistoricotranspagosGENERAL'     , validarJWT, bkhistoricotranspagosGENERAL);





router.post('/bkhomegettodo'         ,validarJWT  , bkhomegettodo); // Ok mostrar todas las casas 
router.post('/bkinserthome'          ,validarJWT  , bkinserthome); // ok ingresar casa
router.post('/bkupdatenamehome'       ,validarJWT  , bkupdatenamehome); // actualizar nombre de casa



router.post('/bkidtophome'           ,validarJWT  , bkidtophome);
router.post('/bkhome'                ,validarJWT  , bkhome);
router.post('/bkhomeSEARCH'          , validarJWT , bkhomeSEARCH);
router.post('/bkcalle'               ,validarJWT  , bkcalle);
router.patch('/bkupdatemensualidad'  , validarJWT  , bkupdatemensualidad);




router.post('/bkanualidad'             , validarJWT ,bkanualidad);
router.post('/factutraemitida'         , validarJWT ,factutraemitida);



router.post('/bkhistoricopagos'    , validarJWT ,bkhistoricopagos);

//GASTOS
router.post('/bkOPgastosinsert'    , validarJWT,bkOPgastosinsert); // ok insertar gasto
router.post('/bkOPgastos'          , validarJWT,bkOPgastos); //ok mostrar gastos con su respectivo tipo de gasto y sector
router.post('/bkinsertgastosector' , validarJWT  ,bkinsertgastosector); // insertar gasto por sector
router.post('/bkfiltroyeargasto'   , validarJWT, bkfiltroyeargasto); // ok mostrar gastos filtrados por año
router.post('/bkgastos'            , validarJWT, bkgastos); // historico de gastos por zona




router.patch('/bkpagoinsert'       , validarJWT ,bkpagoinsert);
router.patch('/bkpagoinsert'       , validarJWT ,bkpagoinsert);
router.post('/bkpdfresumengasto'   , validarJWT,bkpdfresumengasto);



// Api creacion de usario 
router.post('/bkusuarios'          ,validarJWT, bkusuarios);
router.post('/bkcreateuser'        ,validarJWT, bkcreateuser);
router.post('/bkdeleteuser'        ,validarJWT, bkdeleteuser);
router.post('/bkrewpass'           ,validarJWT, bkrewpass);
router.post('/updateuser'          ,validarJWT, updateuser);



///renewToken
router.post('/renewtoken' ,renewToken );

//get imagen
router.get('/getbanner' , getbanner );

// mail 
router.post('/usuarioVerificado'        , usuarioVerificado);
router.patch('/contactenos'             ,validarJWT , mailcontactenos);
router.patch('/updateverificadousuario' ,validarJWTUser , updateverificadousuario);

router.patch('/mailcontacweb'  , mailcontacweb);


//PUSHNOTIFICATION

router.post('/push'            , push );
router.post('/registrarDevice' , registrarDevice );
router.post('/selectDevice'    , selectDevice );
router.post('/deleteDevice'    , deleteDevice );
router.post('/viewnotificacion', viewnotificacion );

//sendpushnotification

router.post('/sendpush' , sendpush);


////GRAFICAS
router.post('/bkgraficamensualgasto', validarJWT ,bkgraficamensualgasto ); // ok mostrar grafica mensual de gasto por zona
router.post('/bkgraficanualgasto',validarJWT , bkgraficanualgasto ); // ok mostrar grafica anual de gasto por zona
router.post('/bkgrafporcpago',validarJWT , bkgrafporcpago ); // ok mostrar grafica anual de porcentaje de pago por zona y casa
module.exports = router;
