const jwt = require('express-jwt'),
      Client = require('./controllers/client');

const authCheck = jwt({
  secret: process.env.AUTH0_CLIENT_SECRET,
  audience: process.env.AUTH0_CLIENT_ID
});

module.exports = function(app) {

  app.get('/api', function(req, res) {
    res.json("Welcome to the Developer Centre Api");
  });

  app.get('/api/clients', Client.getClients);
 
  app.delete('/api/client/:client_id', Client.deleteClient);

  app.post('/api/client', Client.create);
};