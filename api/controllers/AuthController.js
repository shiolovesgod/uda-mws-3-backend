/**
 * AuthController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  register: function (req, res, proceed) {

    if (req.method != 'POST') res.send(`Method Requested: ${req.method}`);

    //this code is hard to follow, I may turn this into a helper function
    createLocalUser(req.body, (dbRes) => { //callback for when done...uses closure

      switch (dbRes.code) {
        case 200:
          res.ok(dbRes.user); //return new user

          //!!!!!!!!set the session code

          break;
        default:
          res.serverError(dbRes.body);
      }

    });

  },

  local: function (req, res, proceed) {

    if (req.method != 'POST') res.send(`Method Requested: ${req.method}`);

    validateLocalUser(req.body, (validRes) => {

      switch (validRes.code) {
        case 200: // all ok
          res.ok(validRes.body); //send user

          //!!!!!!!!set the session code

          break;
        case 401: //bad password
          res.forbidden(validRes.body);
          break;
        case 404: //user not found
          res.notFound(validRes.body);
          break;
      }
    });


  },

  google: function (req, res, proceed) {
    res.send('Google Login requested');
  },

  facebook: function (req, res, proceed) {
    res.send(this);
  },

  logout: function (req, res, proceed) {
    res.send('Logout Requested');
  },


};

var bcrypt = require('bcrypt');

function createLocalUser(params, cb) {
  //Make sure the user doesn't exist
  retrieveUser(params.email, (user) => { //callback after user is found

    if (user) {
      cb({
        code: 400,
        body: 'User Already Exists'
      }); //throw error
      return
    } else {
      //Passwords and form fields already compared on front end
      var newUser = bcrypt.hash(params.password, 10).then(function (hashPW, err) {

        if (err) {
          cb({
            code: 500,
            body: err
          }); //hashing error
          return;
        };

        //create new record
        User.create({
          name: params.name,
          email: params.email,
          password: hashPW,
        }).exec(function (err, user) {

          if (err) {
            cb({
              code: 500,
              body: err
            }); //record creation error
            return;
          }

          cb({
            code: 200,
            body: user.toJSON()
          }); //success
        });

      });

    }
  })
};

function validateLocalUser(params, cb) {

  retrieveUser(params.email, function (user) {

    if (!user) {
      cb({
        code: 404,
        body: 'User not found'
      });
      return
    }; //user not found

    //check password 
    bcrypt.compare(params.password, user.password).then((match) => {
      if (match) {
        cb({
          code: 200,
          body: user
        });
        return
      } else {
        cb({
          code: 401,
          body: 'Incorrect password'
        });
        return;
      }
    });
  });
}

function createOAuthUser(params, platform) {
  //Return promised user .then((err, user, wasCreated))
  return User.findOrCreate({
    email: params.email
  }, {
    name: parmas.name,
    email: params.email,
    platform: platform,
    authid: params.id
  });
};

//Retrieve user if exists
var retrieveUser = function (email, cb) {
  User.findOne({
    email: email
  }).exec((err, user) => {
    // console.log(user);
    if (user) user = user.toJSON();
    cb(user);
  });
};