const express = require("express");
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
require("dotenv").config();
const app = express();
const { getUserItems } = require('./getuseritems');

const PORT = process.env.PORT || 80;

const initializePassport = require("./passportConfig");

initializePassport(passport);

// Middleware

// Parses details from a form
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.use(express.json());

app.use(
  session({
    // Key we want to keep secret which will encrypt all of our information
    secret: process.env.SESSION_SECRET,
    // Should we resave our session variables if nothing has changes which we dont
    resave: false,
    // Save empty value if there is no vaue which we do not want to do
    saveUninitialized: false
  })
);
// Funtion inside passport which initializes passport
app.use(passport.initialize());
// Store our variables to be persisted across the whole session. Works with app.use(Session) above
app.use(passport.session());
app.use(flash());

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/register", checkAuthenticated, (req, res) => {
  res.render("register");
});

app.get("/testwave", (req,res)=>{
  res.render("testwave");
});

app.get("/login", checkAuthenticated, (req, res) => {
  // flash sets a messages variable. passport sets the error message
  //console.log(req.session.flash.error);
  // res.render("login.ejs");
  if (req.user) {
    res.redirect("/profile", req.user);
} else {
    res.render("login");
}
});

app.get('/profile', async (req, res) => {
  req.user.lastvisit = new Date();
    pool.query(
      `UPDATE museground.user SET lastvisit = $1 WHERE userid = $2`, [req.user.lastvisit, req.user.userid],
      (err, results) => {
        if (err) {
          throw err;
        }
      }
    );
    res.render("profile", { user: req.user, action: 'User', type: 'Profile'});  
  });



app.get('/profile/items/tracks', async (req, res) => {
  try {
      var trackpaths = [];
      var trackids = [];
      const items = await getUserItems(req.user.userid);
      items.tracks.forEach(track=>{
        trackids.push(track.trackid);
        trackpaths.push(track.trackpath);
      })
      const trackdata = {trackpaths, trackids};
      res.render("profile", { user: req.user, tracks: items.tracks, trackdata: trackdata, action: 'Downloaded', type: 'Tracks'});     
  } catch (err) {
      res.status(500).send('Error retrieving tracks');
  }
});

app.get('/profile/items/samples', async (req, res) => {
  try {
      const items = await getUserItems(req.user.userid);
      var samplepaths = [];
      var sampleids = [];
      items.samples.forEach(sample=>{
        sampleids.push(sample.sampleid);
        samplepaths.push(sample.samplepath);
      })
      const sampledata = {samplepaths, sampleids};
      res.render("profile", {user: req.user, samples: items.samples, type: 'Samples', sampledata: sampledata, action: 'Downloaded', type: 'Samples' });
  } catch (err) {
      res.status(500).send('Error retrieving samples');
  }
});

app.get('/profile/items/packs', async (req, res) => {
  try {
      var samplepaths = [];
      var sampleids = [];
      const items = await getUserItems(req.user.userid);
      items.packs.forEach(pack=>{pack.samples.forEach(sample=>{
        sampleids.push(sample.sampleid);
        samplepaths.push(sample.samplepath);
        });
      });
      const sampledata = {samplepaths, sampleids};
      //console.log(sampledata);
      res.render('profile', { user: req.user, packs: items.packs, action: 'Downloaded', type: 'Packs', sampledata: sampledata });
  } catch (err) {
      res.status(500).send('Error retrieving packs');
  }
});

app.get('/profile/items/presets', async (req, res) => {
  try {
      const items = await getUserItems(req.user.userid);

      res.render('profile', {user: req.user, presets: items.presets, action: 'Downloaded', type: 'Presets' });
  } catch (err) {
      res.status(500).send('Error retrieving presets');
  }
});

app.get('/profile/items/plugins', async (req, res) => {
  try {
      const items = await getUserItems(req.user.userid);
      res.render('profile', { user: req.user, plugins: items.plugins, action: 'Downloaded', type: 'Plugins' });
  } catch (err) {
      res.status(500).send('Error retrieving plugins');
  }
});

app.get('/profile/items/samples-created', async(req,res)=>{
  try
  {
    var samples = [];
    pool.query(
      `SELECT * FROM museground.sample WHERE author = $1`, [req.user.userid], (err, results) =>
        {
          if(err) {throw err;}
          else 
          {
            samples = results.rows;
            var samplepaths = [];
            var sampleids = [];
            samples.forEach(sample=>{
              sampleids.push(sample.sampleid);
              samplepaths.push(sample.samplepath);
            })
            const sampledata = {samplepaths, sampleids};
            console.log(sampledata);
            res.render("profile", {user: req.user, csamples: samples, action: 'Created', type: "Samples", csampledata: sampledata});
          }
        }
    )
  }
  catch(err)
  {
    res.status(500).send('Error retrieving created samples');
  }
})

app.get('/profile/items/packs-created', async (req, res) => {
  try {
    const packResults = await pool.query('SELECT * FROM museground.pack WHERE author = $1', [req.user.userid]);
    const packs = packResults.rows;

    for (const pack of packs) {
      const sampleResults = await pool.query('SELECT * FROM museground.sample WHERE belongto = $1', [pack.packid]);
      pack.samples = sampleResults.rows;
    }

    const samplepaths = packs.flatMap(pack => pack.samples.map(sample => sample.samplepath));
    const sampleids = packs.flatMap(pack => pack.samples.map(sample => sample.sampleid));

    const sampledata = { samplepaths, sampleids };
    res.render('profile', {user: req.user, packs: packs, action: 'Created', type: 'Packs', sampledata: sampledata });
  } catch (err) {
    console.error('Error retrieving created packs or their samples:', err);
    res.status(500).send('Error retrieving created packs or their samples');
  }
});

app.get('/profile/items/presets-created', async(req,res)=>{
  try
  {
    var presets = [];
    pool.query(
      `SELECT * FROM museground.preset WHERE author = $1`, [req.user.userid], (err, results) =>
        {
          if(err) {throw err;}
          else 
          {
            presets = results.rows;
            res.render("profile", {user: req.user, presets: presets, action: 'Created', type: "Presets"});
          }
        }
    )
  }
  catch(err)
  {
    res.status(500).send('Error retrieving created presets');
  }
})

app.get('/tracks', async(req,res)=>{
  var tracks = [];
  var trackids = [];
  var trackpaths = [];
  pool.query(
    `SELECT * FROM museground.track ORDER BY trackid ASC`, [], (err, results) =>
    {
      if(err) {throw err;}
      else
      {
        tracks = results.rows;
        tracks.forEach(track=>{
          trackids.push(track.trackid);
          trackpaths.push(track.trackpath);
        });
        const trackdata = {trackids, trackpaths};
        console.log(tracks, trackdata);
          res.render('tracks', { type: 'Random', tracks: tracks, trackdata: trackdata});
      }
    }
  )
});

app.get('/tracks/new', async(req,res)=>{
  res.render('tracks');
});

app.get('/tracks/genres', async(req,res)=>{
  res.render('tracks');
});

app.get('/tracks/authors', async(req,res)=>{
  res.render('tracks');
});

app.get('/tracks/labels', async(req,res)=>{
  res.render('tracks');
});

app.get('/samples', async(req,res)=>{
  res.render('samples');
});

app.get('/packs', async(req,res)=>{
  res.render('packs');
});

app.get('/presets', async(req,res)=>{
  res.render('presets');
});

app.get('/plugins', async(req,res)=>{
  res.render('plugins');
});

app.get('/logout', function(req, res, next) {
    req.logout(function(err) {
      if (err) { return next(err); }
      res.render("login", { message: "You have logged out successfully" });
    });
  });

app.post("/register", async (req, res) => {
  let { username, email, password, password2 } = req.body;

  let errors = [];

  // console.log({
  //   username,
  //   email,
  //   password,
  //   password2
  // });

  if (!username || !email || !password || !password2) {
    errors.push({ message: "Please enter all fields" });
  }

  if (password.length < 6) {
    errors.push({ message: "Password must be a least 6 characters long" });
  }

  if (password !== password2) {
    errors.push({ message: "Passwords do not match" });
  }

  if (errors.length > 0) {
    res.render("register", { errors, username, email, password, password2 });
  } else {
    hashedPassword = await bcrypt.hash(password, 10);
    //console.log(hashedPassword);
    // Validation passed
    pool.query(
      `SELECT * FROM museground.user
        WHERE email = $1`,
      [email],
      (err, results) => {
        if (err) {
          console.log(err);
        }
        //console.log(results.rows);

        if (results.rows.length > 0) {
          return res.render("register", {
            message: "Email already registered"
          });
        } else {
          pool.query(
            `INSERT INTO museground.user 
                        (username, email, password, lastvisit, dateregistered, maxtracks)
                        VALUES ($1, $2, $3, $4, $5, $6)
                        RETURNING userid, password`,
            [username, email, hashedPassword, new Date, new Date(), 20],
            (err, results) => {
              if (err) {
                throw err;
              }
              //console.log(results.rows);
              req.flash("success_msg", "You are now registered. Please log in");
              res.redirect("/login");
            }
          );
        }
      }
    );
  }
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/login",
    failureFlash: true
  })
);

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/profile");
  }
  next();
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});