var _ = require('lodash');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var passport = require('passport');
var User = require('../models/User');
var secrets = require('../config/secrets');
var mongoose = require('mongoose');
var db = mongoose.connection
var forEachAsync = require('foreachasync').forEachAsync;

var handleError = function(err){
  console.log(err);
}
/**
 * POST /app/recordScore/:opponent
 * Record score
 */

exports.recordScore = function(req, res, next) {
  if (req.user.id === opponent ) return; // if user is playing against himself, that's not fair
  
  var match = {
    date    : '',
    winner  : {},
    loser   : {}
  };

  var opponent = User.findOne({ _id: req.params.opponent }, function(err, opponent) {
    if (err) return next(err);

    var createMatchSnapshot = function(winnerParam, loserParam){
      match.date          = new Date();
      var day = match.date.getDate();
      var month = new Array();
      month[0] = "Jan";
      month[1] = "Feb";
      month[2] = "March";
      month[3] = "April";
      month[4] = "May";
      month[5] = "June";
      month[6] = "July";
      month[7] = "Aug";
      month[8] = "Sept";
      month[9] = "Oct";
      month[10] = "Nov";
      month[11] = "Dec";
      var n = month[match.date.getMonth()];
      var year = match.date.getFullYear();

      match.dateString    = n + ' ' + day + ' ' + year;

      match.winner.id     = winnerParam._id,
      match.winner.wins   = winnerParam.wins,
      match.winner.losses = loserParam.wins,
      match.winner.email  = winnerParam.email,
      match.loser.img     = winnerParam.profile.picture,
      match.winner.name   = winnerParam.profile.name,
      match.winner.score  = winnerParam.profile.score,
      match.winner.rank   = winnerParam.profile.rank,

      match.loser.id     = loserParam._id,
      match.loser.wins   = loserParam.wins,
      match.loser.losses = winnerParam.wins,
      match.loser.email  = loserParam.email,
      match.loser.img    = loserParam.profile.picture,
      match.loser.name   = loserParam.profile.name,
      match.loser.score  = loserParam.profile.score,
      match.loser.rank   = loserParam.profile.rank;

    };

    var assignPointsAndRankAndSave = function(matchParam, winnerParam, loserParam) {
      var matchPoints = matchParam.winner.wins - match.loser.wins;

      if(winnerParam.rank > loserParam.rank){
        var rankPoints = winnerParam.profile.rank - loserParam.profile.rank;
        // swap the ranks
        var winnerRank = winnerParam.profile.rank;
        var loserRank = loserParam.profile.rank;
        winnerParam.profile.rank = loserRank;
        loserParam.profile.rank = loserRank;

      } else {
        var rankPoints = loserParam.profile.rank - winnerParam.profile.rank;
      }
      debugger;
      // assign points to winner
      var totalPoints = rankPoints + matchPoints;
      winnerParam.profile.score += totalPoints;
      loserParam.profile.score -+ totalPoints;
      var playerArray = [winnerParam, loserParam];

      [winnerObject, loserObject].forEach(function(user){
        if (!user.matches){
          user.matches = [];
        } 
        user.matches.push(match);
        user.save(function(err) {
          if (err) return next(err);
        });
      }).then(function() {
        debugger;
        res.send({ success : true })
      })

      forEachAsync(playerArray, function(user){
        return User.findByIdAndUpdate({_id: user.id || user._id }, { $set: { 'matches' : user.matches }}).exec();
      }).then(function(){
        res.send({ success : true })
      }).catch(function(err){
        handleError(err);
        res.send({ error: { message: err.message || err.toString() }})
      })

      // forEachAsync(playerArray, function(user){
      //   return User.findByIdAndUpdate({_id: user.id || user._id }, { $set: { 'matches' : user.matches }}).exec();
      // }).then(function(){
      //   res.send({ success : true })
      // }).catch(function(err){
      //   handleError(err);
      //   res.send({ error: { message: err.message || err.toString() }})
      // })
    }



    // sets Player Objects and Winner Loser Objects
    var userObject      = req.user;
    userObject.wins = parseInt(req.body.userWins, 10);

    var opponentObject = opponent;
    opponentObject.wins = parseInt(req.body.opponentWins, 10);




    // logic for finding winner
    if (userObject.wins > opponentObject.wins){
      var winnerObject  = userObject;
      var loserObject   = opponentObject;
    } else {
      var winnerObject  = opponentObject;
      var loserObject   = userObject;
    }

    createMatchSnapshot(winnerObject, loserObject);

    assignPointsAndRankAndSave(match, winnerObject, loserObject)
    // TODO: sets to a "matches" collection


  });

};

/**
 * GET /login
 * Login page.
 */

exports.getLogin = function(req, res) {
  if (req.user) return res.redirect('/');
  res.render('account/login', {
    title: 'Login'
  });
};

/**
 * POST /login
 * Sign in using email and password.
 * @param email
 * @param password
 */

exports.postLogin = function(req, res, next) {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password cannot be blank').notEmpty();

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/login');
  }

  passport.authenticate('local', function(err, user, info) {
    if (err) return next(err);
    if (!user) {
      req.flash('errors', { msg: info.message });
      return res.redirect('/login');
    }
    req.logIn(user, function(err) {
      if (err) return next(err);
      req.flash('success', { msg: 'Success! You are logged in.' });
      res.redirect(req.session.returnTo || '/');
    });
  })(req, res, next);
};

/**
 * GET /logout
 * Log out.
 */

exports.logout = function(req, res) {
  req.logout();
  res.redirect('/');
};

/**
 * GET /signup
 * Signup page.
 */

exports.getSignup = function(req, res) {
  if (req.user) return res.redirect('/');
  res.render('account/signup', {
    title: 'Signup'
  });
};

/**
 * POST /signup
 * Create a new local account.
 * @param email
 * @param password
 */

exports.postSignup = function(req, res, next) {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/signup');
  }

  var user = new User({
    email: req.body.email,
    password: req.body.password
  });

  User.findOne({ email: req.body.email }, function(err, existingUser) {
    if (existingUser) {
      req.flash('errors', { msg: 'Account with that email address already exists.' });
      return res.redirect('/signup');
    }
    user.save(function(err) {
      if (err) return next(err);
      req.logIn(user, function(err) {
        if (err) return next(err);
        res.redirect('/');
      });
    });
  });
};

/**
 * GET /account
 * Profile page.
 */

exports.getAccount = function(req, res) {
  res.render('account/profile', {
    title: 'Account Management'
  });
};

/**
 * POST /account/profile
 * Update profile information.
 */

exports.postUpdateProfile = function(req, res, next) {
  User.findById(req.user.id, function(err, user) {
    if (err) return next(err);
    user.email = req.body.email || '';
    user.profile.name = req.body.name || '';
    user.profile.gender = req.body.gender || '';
    user.profile.location = req.body.location || '';
    user.profile.website = req.body.website || '';

    user.save(function(err) {
      if (err) return next(err);
      req.flash('success', { msg: 'Profile information updated.' });
      res.redirect('/account');
    });
  });
};

/**
 * POST /account/password
 * Update current password.
 * @param password
 */

exports.postUpdatePassword = function(req, res, next) {
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/account');
  }

  User.findById(req.user.id, function(err, user) {
    if (err) return next(err);

    user.password = req.body.password;

    user.save(function(err) {
      if (err) return next(err);
      req.flash('success', { msg: 'Password has been changed.' });
      res.redirect('/account');
    });
  });
};

/**
 * POST /account/delete
 * Delete user account.
 */

exports.postDeleteAccount = function(req, res, next) {
  User.remove({ _id: req.user.id }, function(err) {
    if (err) return next(err);
    req.logout();
    req.flash('info', { msg: 'Your account has been deleted.' });
    res.redirect('/');
  });
};

/**
 * GET /account/unlink/:provider
 * Unlink OAuth provider.
 * @param provider
 */

exports.getOauthUnlink = function(req, res, next) {
  var provider = req.params.provider;
  User.findById(req.user.id, function(err, user) {
    if (err) return next(err);

    user[provider] = undefined;
    user.tokens = _.reject(user.tokens, function(token) { return token.kind === provider; });

    user.save(function(err) {
      if (err) return next(err);
      req.flash('info', { msg: provider + ' account has been unlinked.' });
      res.redirect('/account');
    });
  });
};

/**
 * GET /reset/:token
 * Reset Password page.
 */

exports.getReset = function(req, res) {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  User
    .findOne({ resetPasswordToken: req.params.token })
    .where('resetPasswordExpires').gt(Date.now())
    .exec(function(err, user) {
      if (!user) {
        req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
        return res.redirect('/forgot');
      }
      res.render('account/reset', {
        title: 'Password Reset'
      });
    });
};

/**
 * POST /reset/:token
 * Process the reset password request.
 * @param token
 */

exports.postReset = function(req, res, next) {
  req.assert('password', 'Password must be at least 4 characters long.').len(4);
  req.assert('confirm', 'Passwords must match.').equals(req.body.password);

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('back');
  }

  async.waterfall([
    function(done) {
      User
        .findOne({ resetPasswordToken: req.params.token })
        .where('resetPasswordExpires').gt(Date.now())
        .exec(function(err, user) {
          if (!user) {
            req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
            return res.redirect('back');
          }

          user.password = req.body.password;
          user.resetPasswordToken = undefined;
          user.resetPasswordExpires = undefined;

          user.save(function(err) {
            if (err) return next(err);
            req.logIn(user, function(err) {
              done(err, user);
            });
          });
        });
    },
    function(user, done) {
      var transporter = nodemailer.createTransport({
        service: 'Mandrill',
        auth: {
          user: secrets.mandrill.user,
          pass: secrets.mandrill.password
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'hackathon@starter.com',
        subject: 'Your Hackathon Starter password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      transporter.sendMail(mailOptions, function(err) {
        req.flash('success', { msg: 'Success! Your password has been changed.' });
        done(err);
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/');
  });
};

/**
 * GET /forgot
 * Forgot Password page.
 */

exports.getForgot = function(req, res) {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.render('account/forgot', {
    title: 'Forgot Password'
  });
};

/**
 * POST /forgot
 * Create a random token, then the send user an email with a reset link.
 * @param email
 */

exports.postForgot = function(req, res, next) {
  req.assert('email', 'Please enter a valid email address.').isEmail();

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/forgot');
  }

  async.waterfall([
    function(done) {
      crypto.randomBytes(16, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email.toLowerCase() }, function(err, user) {
        if (!user) {
          req.flash('errors', { msg: 'No account with that email address exists.' });
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var transporter = nodemailer.createTransport({
        service: 'Mandrill',
        auth: {
          user: secrets.mandrill.user,
          pass: secrets.mandrill.password
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'hackathon@starter.com',
        subject: 'Reset your password on Hackathon Starter',
        text: 'You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      transporter.sendMail(mailOptions, function(err) {
        req.flash('info', { msg: 'An e-mail has been sent to ' + user.email + ' with further instructions.' });
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
};
