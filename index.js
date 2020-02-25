const Sequelize = require('sequelize');
const config = require('./config.json');
const db = require('./models')(Sequelize, config);
const utils = require('./utils')
const express = require('express');
const bodyParser = require('body-parser');
const geolib = require('geolib');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(bodyParser.json());

const fleetsRouter = express.Router();
const motionsRouter = express.Router();
const vehiclesRouter = express.Router();
const geoRouter = express.Router();
const managersRouter = express.Router();

app.use((request, response, next) =>{
  if (request.originalUrl == '/api/auth/register' || request.originalUrl == '/api/auth/login'){
    console.log(request.originalUrl);
    next();
    return;
  }
  const token = request.get('Authorization');
  if (!token){
    response.sendStatus(401);
    return;
  }
  let decode;
  try{
    decode = jwt.verify(token, 'secret');
  }
  catch(err){
    console.error(err);
    response.sendStatus(400);
    return;
  }

  db.managers.findByPk(decode.id)
  .then((m) =>{
    request.manager = m;
    next();
  })
  .catch((err) =>{
    response.sendStatus(403);
    return;
  })
})

fleetsRouter.get('/readall', (req, res) => {
  if (!req.manager.super){
    res.sendStatus(403);
    return;
  }
  db.fleets.findAll({raw: true}).then((f) =>{
    res.send(f);
  }).catch((err) =>{
    res.sendStatus(404);
  });
});

fleetsRouter.get('/read', (req, res) => {
  db.fleets.findByPk(req.manager.super ? req.query.id : req.manager.fleetId, {raw: true}).then((f) =>{
    res.send(f);
  })
  .catch((err) =>{
    res.sendStatus(404);
  });
});

fleetsRouter.post('/create', (req, res) => {
  if (!req.manager.super){
    res.sendStatus(403);
    return;
  }
  db.fleets.create({
    name: req.body.name
  }).then((f) =>{
    res.send(f.dataValues);
  }).catch((err) =>{
    res.sendStatus(400);
  });
});

fleetsRouter.post('/update', (req, res) => {
  if (!req.manager.super){
    res.sendStatus(403);
    return;
  }
  if (!utils.fleetValidate(req.body.id, req.body.name)){
    res.sendStatus(400);
    return;
  }

  db.fleets.update({
    name: req.body.name
  }, {
    where: {
      id: req.body.id
    }
  }).then(() =>{
    res.sendStatus(200);
  }).catch((err) =>{
    res.sendStatus(400);
  });
});

fleetsRouter.post('/delete', (req, res) => {
  if (!req.manager.super){
    res.sendStatus(403);
    return;
  }
  db.fleets.destroy({
    where: {
      id: req.body.id
    }
  }).then(() => {
    res.sendStatus(200);
  }).catch((err) =>{
    res.sendStatus(400);
  });
});

app.use("/api/fleets", fleetsRouter);

vehiclesRouter.get('/readall', (req, res) => {
  db.vehicles.findAll({raw: true}).then((v) =>{
    res.send(v);
  });
});

vehiclesRouter.get('/read', (req, res) => {
  db.vehicles.findByPk(req.query.id, {raw: true}).then((v) =>{
    res.send(v);
  })
  .catch((err) =>{
    res.sendStatus(404);
  });
});

vehiclesRouter.post('/create', (req, res) => {
  db.vehicles.create({
    name: req.body.name,
    fleetId: req.body.fleetId
  }).then((v) =>{
    res.send(v.dataValues);
  }).catch((err) =>{
    res.sendStatus(400);
  });
});

vehiclesRouter.post('/update', (req, res) => {
  if (!utils.vehiclesValidate(req.body.id, req.body.name, req.body.fleetId)){
    res.sendStatus(400);
    return;
  }

  db.vehicles.update({
    name: req.body.name,
    fleetId: req.body.fleetId
  }, {
    where: {
      id: req.body.id
    }
  }).then(() =>{
    res.sendStatus(200);
  }).catch((err) =>{
    res.sendStatus(400);
  });
});

vehiclesRouter.post('/delete', (req, res) => {
  db.vehicles.destroy({
    where: {
      id: req.body.id
    }
  }).then(() => {
    res.sendStatus(200);
  }).catch((err) =>{
    res.sendStatus(400);
  });
});

app.use("/api/vehicles", vehiclesRouter);

motionsRouter.post('/create', (req, res) => {
  if (!utils.motionsValidate(req.body.longitude, req.body.latitude, req.body.vehicleId)){
    res.sendStatus(400);
    return;
  }

  db.motions.create({
    longitude: req.body.longitude,
    latitude: req.body.latitude,
    time: Date.now(),
    vehicleId: req.body.vehicleId
  }).then((m) =>{
    res.send(m.dataValues);
  }).catch((err) =>{
    res.sendStatus(400);
  });
});

app.use("/api/motions", motionsRouter);

geoRouter.get('/millage', (req, res) => {
  db.motions.findAll({attributes: ['latitude', 'longitude'], where:{vehicleId: req.query.id}, raw: true}).then((m) =>{
    if (m.lenght < 2) res.sendStatus(404);
    else res.send(JSON.stringify(
      geolib.getDistance(m[0], m[m.lenght-1])
    ));
  });
});

app.use("/api/vehicles", geoRouter);

managersRouter.post('/register', (req, res) => {
  db.managers.create({
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10)
  }).then((m) =>{
    res.sendStatus(200);
  }).catch((err) =>{
    res.sendStatus(400);
  });
});

managersRouter.post('/login', (req, res) => {
  db.managers.findOne({where: {email: req.body.email}, raw: true})
    .then((manager) =>{
      if (bcrypt.compareSync(req.body.password, manager.password)){
        const token = jwt.sign({
          id: manager.id,
          email: manager.email
        }, 'secret', { expiresIn: '5m' });
        res.setHeader('Authorization', token);
        res.sendStatus(200);
      }else{
        throw err;
      }
    })
    .catch((err) =>{
      res.sendStatus(400);
    });
});

app.use("/api/auth", managersRouter);

app.listen(3000, () => {
  console.log('Server app listening on port 3000!');
})
