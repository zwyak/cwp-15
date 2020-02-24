module.exports = (Sequelize, sequelize) => {
  return sequelize.define('managers', {
    id:{
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: Sequelize.STRING
    },
    password: {
      type: Sequelize.STRING
    },
    fleetId:{
      type: Sequelize.INTEGER
    },
    super:{
      type: Sequelize.BOOLEAN
    }
  });
};
