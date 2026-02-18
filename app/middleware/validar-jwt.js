const jwt = require('jsonwebtoken');


const validarJWT = (req, res, next) => {
  const authTokenHeader = req.header("auth-token");
  const authHeader = req.header("authorization");

  let token = authTokenHeader;

  if (!token && authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    token = authHeader.slice(7).trim();
  }

  if (!token) {
    return res.status(401).json({
      ok: false,
      msg: "No hay token en la petición",
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_KEY);
    req.auth = payload; // ej: { id, user, role, iat, exp }
    next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      msg: "Token no válido",
    });
  }
};


// const validarJWT =(req, res, next) => {
    
//     const token = req.header('auth-token');

//     if(!token){
//         return res.status(401).json({
//             ok:false,
//             msg:'no hay token en la peticion'
//         });
//     }

//     try{
//         //  console.log(token, req.user);
//         const payload = jwt.verify( token ,process.env.JWT_KEY,{
//             expiresIn: process.env.JWT_EXP
//         });
//         req.auth = payload;
        
//         //  req.user = user;
//         //  console.log(payload);
       
//         // var d1 = new Date(payload.exp*1000);
//         // var d2 = new Date(payload.iat*1000);
     
//         next();


//     }catch(error){
//         return res.status(401).json({
//             ok:false,
//             msg: 'token no valido'
//         });
//     }

    


   
// }

const validarJWTUser =(req, res, next) => {
    
    const token = req.header('auth-token');


    if(!token){
        return res.status(401).json({
            ok:false,
            msg:'no hay token en la peticion'
        });
    }

    try{
        //  console.log(token, req.user);
        const payload = jwt.verify( token ,process.env.JWT_TOKENVALIDACION,{
            expiresIn: process.env.JWT_EXPVAL
        });
        
        //  req.user = user;
        //  console.log(payload);
       
        // var d1 = new Date(payload.exp*1000);
        // var d2 = new Date(payload.iat*1000);
     
        next();


    }catch(error){
        return res.status(401).json({
            ok:false,
            msg: 'token no valido'
        });
    }

    


   
}


module.exports= {
    validarJWT,
    validarJWTUser
}
