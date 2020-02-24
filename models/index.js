const Fleet = require('./fleets');
const Motion = require('./motions');
const Vehicle = require('./vehicles');
const Manager = require('./managers');

module.exports = (Sequelize, config) => {
  const sequelize = new Sequelize(config.database, {
    define: {
      timestamps: true,
      paranoid: true
    }
  });

  const motions = Motion(Sequelize, sequelize);
  const vehicles = Vehicle(Sequelize, sequelize);
  const managers = Manager(Sequelize, sequelize);
  const fleets = Fleet(Sequelize, sequelize);

  fleets.hasOne(vehicles);
  fleets.hasOne(managers);
  vehicles.hasOne(motions);

  sequelize.sync()
  .then((result) => {
    console.log(result);
  });


  return {
    fleets,
    vehicles,
    motions,
    managers,

    sequelize: sequelize,
    Sequelize: Sequelize,
  };
};
