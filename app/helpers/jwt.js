var jwt = require('jsonwebtoken');

var dateTime = require('node-datetime');


const generarJWT = (user)=>{

return new Promise((resolve, reject)=>{

    const payload = {user};

   

    jwt.sign(payload,process.env.JWT_KEY,{
        expiresIn: process.env.JWT_EXP
    },(err,token)=>{
        if(err){
            //no se pudo crear el tocken
            reject('No se pudo generar el JWT');
        }else{

            const vefjwt = jwt.verify( token ,process.env.JWT_KEY,{
                expiresIn: process.env.JWT_EXP
            });
            
            var exp = new Date(vefjwt.exp * 1000);
            // var dt = datetime.create(vefjwt.exp );
            // var expiracion =  dateTime.create(Date(vefjwt.exp * 1000));
            // var exp =  expiracion.format('m/d/Y H:M:S');
            // console.log(exp);

            resolve( { token , exp } );
        }
    })

})

}


const generarJWTValuser = (iduser)=>{



    return new Promise((resolve, reject)=>{
    
        const payload = {iduser};
    
       
    
        jwt.sign(payload,process.env.JWT_TOKENVALIDACION,{
            expiresIn: process.env.JWT_EXPVAL
        },(err,token)=>{
            if(err){
                //no se pudo crear el tocken
                reject('No se pudo generar el JWT');
            }else{
    
                const vefjwt = jwt.verify( token ,process.env.JWT_TOKENVALIDACION,{
                    expiresIn: process.env.JWT_EXPVAL
                });
                
                var exp = new Date(vefjwt.exp * 1000);
                // var dt = datetime.create(vefjwt.exp );
                // var expiracion =  dateTime.create(Date(vefjwt.exp * 1000));
                // var exp =  expiracion.format('m/d/Y H:M:S');
                // console.log(exp);
    
                resolve( { token , exp } );
            }
        })
    
    })
    
    }

module.exports = {
    generarJWT,
    generarJWTValuser
}