

module.exports = (sequelize, DataTypes) => {
    const Users = sequelize.define('usuario', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        //defaultValue: DataTypes.UUIDV4,
        allowNull: false
      },
      usuario: {
        type: DataTypes.STRING
    },
    pass: {
        type: DataTypes.STRING
    },
  
    apellido: {
        type: DataTypes.STRING
    },
 
    nombre: {
        type: DataTypes.STRING
    },
 
    telefono: {
        type: DataTypes.STRING
    },
    correo: {
        type: DataTypes.STRING
    },
    roll: {
        type: DataTypes.STRING
    },
    status: {
        type: DataTypes.INTEGER
    },
    casa: {
        type: DataTypes.INTEGER
    },
   
    }, 
    {
        freezeTableName: true,
    }
    );
    return Users;
  };
