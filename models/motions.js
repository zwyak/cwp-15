module.exports = (Sequelize, sequelize) => {
  return sequelize.define('motions', {
    id:{
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    latitude: {
      type: Sequelize.DOUBLE
    },
    longitude: {
      type: Sequelize.DOUBLE
    },
    time:{
      type: Sequelize.INTEGER
    },
    vehicleId: {
      type: Sequelize.INTEGER
    }
  }, {
    geterMethods:{
      latLng(){
        return this.latitude + ' ' + this.longitude;
      }
    }
  });
}
