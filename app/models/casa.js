
module.exports = (sequelize, DataTypes) => {
    const Casa = sequelize.define('casa', {

        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            //defaultValue: DataTypes.UUIDV4,
            allowNull: false
          },
          idunico: {
            type: DataTypes.STRING
        },
        idcodcalle: {
            type: DataTypes.STRING
        },
      
        casa: {
            type: DataTypes.STRING
        },
    
        idadmin: {
            type: DataTypes.STRING
        },
        }, 
        {
            freezeTableName: true,
        }
        );
        return Casa;
      };
