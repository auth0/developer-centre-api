const secrets = require('../config/secrets'),
      request = require('request'),
      async   = require('async'),
      Client  = require('../models/client');

module.exports = {

  /**
   * Register Client with name, redirect_url and other information
   * @param  req
   * @param  res
   * @return Void
   */
  create: function(req, res) {
    var redirectUris = req.body.redirect_uris;
    var redirectUrisArray = (redirectUris.indexOf(",") > 0 ) ? req.body.redirect_uris.split(",") : [redirectUris];

    async.waterfall([
      function(cb) {

        
        const options = { 
          method: 'POST',
          url: `https://${process.env.AUTH0_DOMAIN}/oidc/register`,
          headers: { 'content-type': 'application/json' },
          body: 
          { client_name: req.body.client_name,
            redirect_uris: redirectUrisArray
          },
          json: true 
        };

        request(options, function (error, response, body) {
          if (error) throw new Error(error);

          const clientDetails = {
            clientID : body.client_id,
            clientSecret: body.client_secret
          };

          cb(null, clientDetails);
        });
      }
    ], function(err, result) {
      var client        = new Client();
        client.client_name   = req.body.client_name;
        client.client_id     = result.clientID;
        client.client_secret = result.clientSecret
        client.redirect_uris = redirectUrisArray;
        client.createdBy     = req.body.createdBy;

        client.save( function(err, users){
          if(err) {
            if(err.name == 'MongoError') {
              return res.json({ Error: err.errmsg });
            }
          } else {
            console.log(" Users Details ", users);
            return res.status(200).json({ success: true, message: "New Client Registered successfully" });
          }
        });
    });
  },

  /**
   * Fetch Clients Created by a particular uSER
   * @param   req
   * @param   res
   * @param   next
   * @return  Void
   */
  getClients: function(req, res){

    console.log("Request dot query", req.query.createdBy);

    if(req.query.createdBy === undefined) {
      Client.find({}, function(err, client) {
        if(err) {
          return res.status(404).json({error: err});
        }

        if(client.length === 0){
          return res.status(200).json({ success: false, message: 'No Clients created yet.' });
        }

        return res.status(200).json({success: true, client: client});
      });
      return;
    }

    var userId = req.query.createdBy;
    Client.find({createdBy: userId}, function (err, client) {
        if(err) {
          return res.status(404).json({ error: err });
        }

        if(client.length === 0){
          return res.json({ success: false, message: 'No Clients created yet.' });
        }

        return res.status(200).json({success: true, client: client});
    });
  },

  /**
   * Fetch A User Details via username
   * @param  {void}   req
   * @param  {void}   res
   * @param  {Function} next
   * @return {object}
   */
  getEachUserByUsername: function(req, res, next){
    var userReal = req.params.username;

    User.find({username: userReal}, function (err, user) {
      if(err) {
        return res.status(404).json({ err: err });
      }

      if(user.length === 0){
        return res.json({ success: false, message: 'User not found.' });
      }
      else if(user.length == 1) {
        var userDetails = {};
        userDetails.email           = user[0].email;
        userDetails.fullname        = user[0].fullname;
        userDetails.username        = user[0].username;
        userDetails.user_avatar     = user[0].user_avatar;
        userDetails.admin           = user[0].admin;
        userDetails.bio             = user[0].bio;
        userDetails.hire_status     = user[0].hire_status;
        userDetails.address         = user[0].address;
        userDetails.github_profile  = user[0].github_profile;
        userDetails.website         = user[0].website;
        userDetails.registered      = user[0].registered_on;

        return res.json({success: true, user: userDetails});
      }
      next();
    });
  },



  /**
   * Update User Details
   * @param  req
   * @param  res
   * @param  next
   * @return Void
   */
  updateEachUserDetails: function(req, res, next){
    var userId      = req.params.user_id;
    var userDetails = req.body;

    User.update({_id: userId}, userDetails, function (err) {
      if(err) {
        return res.status(404).json({success: false, message: 'User Details Not Found', err: err});
      }

      res.status(200).json({success: true, message: 'Update Successful'});
      next();
    });
  },

  /**
   * Delete A User
   * @param  req
   * @param  res
   * @param  next
   * @return Void
   */
  deleteClient: function(req, res, next) {
    var clientID   = req.params.client_id;

    async.waterfall([
      function(cb) {

        const options = { 
          method: 'DELETE',
          url: `https://${process.env.AUTH0_DOMAIN}/api/v2/clients/${clientID}`,
          headers: { 'Authorization' : `Bearer ${process.env.API2_ACCESS_TOKEN}` }
        };

        request(options, function (error, response, body) {
          if (error) throw new Error(error);

        

          cb(null, response);
        });
      }
    ], function(err, result) {
        console.log("Result of delete operation", result.statusCode);

        console.log("Client ID", clientID);

        Client.remove({client_id: clientID}, function (err, user) {
          if(err) {
            return res.status(404).json({success: false, message: 'Client Details Not Found'});
          }
           
          console.log("User ", user);
          res.json({success: true, message: 'Delete Successful'});
          next();
        });
    });
  }
};