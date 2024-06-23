const express = require("express");
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const fs = require('fs');
const path = require('path');
const multer = require('multer');
require("dotenv").config();
const app = express();
const { getUserItems } = require('./getuseritems');

let genres = [];
let types = [];
let plugins = [];
let instruments = [];
let effects = [];

const dynamicStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath;
    if (file.fieldname === 'image') {
      uploadPath = path.join(__dirname, 'public', 'images');
    } else if (file.fieldname === 'preset') {
      uploadPath = path.join(__dirname, 'public', 'presets');
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: dynamicStorage });

const PORT = process.env.PORT || 80;

const initializePassport = require("./passportConfig");

initializePassport(passport);

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
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
app.use(passport.initialize());
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

app.get('/profile', checkNotAuthenticated, async (req, res) => {
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


  app.post('/delete/:type', checkNotAuthenticated, async (req, res) => {
    const { type } = req.params;
    const { itemid } = req.body;
  
    // Validate type to avoid SQL injection
    const validTypes = ['sample', 'pack', 'preset']; // Add other valid types here
    if (!validTypes.includes(type)) {
      return res.status(400).send('Invalid type');
    }
  
    try {
      const result = await pool.query(`DELETE FROM museground.${type} WHERE ${type}id = $1`, [itemid]);
      res.redirect("profile", { user: req.user, action: 'User', type: 'Profile'});
      //res.status(200).send(`Successfully deleted ${type} with id ${itemid}`);
    } catch (err) {
      console.error('Error deleting record:', err);
      res.status(500).send('Server error');
    }
  });

app.get('/profile/items/tracks', checkNotAuthenticated, async (req, res) => {
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

app.get('/profile/items/samples', checkNotAuthenticated, async (req, res) => {
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

app.get('/profile/items/packs', checkNotAuthenticated, async (req, res) => {
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

app.get('/profile/items/presets', checkNotAuthenticated, async (req, res) => {
  try {
      const items = await getUserItems(req.user.userid);

      res.render('profile', {user: req.user, presets: items.presets, action: 'Downloaded', type: 'Presets' });
  } catch (err) {
      res.status(500).send('Error retrieving presets');
  }
});

app.get('/profile/items/plugins',checkNotAuthenticated, async (req, res) => {
  try {
      const items = await getUserItems(req.user.userid);
      res.render('profile', { user: req.user, plugins: items.plugins, action: 'Downloaded', type: 'Plugins' });
  } catch (err) {
      res.status(500).send('Error retrieving plugins');
  }
});

app.get('/profile/items/samples-created', checkNotAuthenticated,async(req,res)=>{
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

app.get('/profile/items/packs-created',checkNotAuthenticated, async (req, res) => {
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

app.get('/profile/items/presets-created',checkNotAuthenticated, async(req,res)=>{
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

app.get('/tracks',checkNotAuthenticated, async(req,res)=>{
  const { tracks, trackdata } = await getTracks('SELECT * FROM museground.track ORDER BY trackid');
  tracks.forEach(track => {
    track.dateadded = setDate(new Date(track.dateadded));
    track.datecreated = setDate(new Date(track.datecreated));
});
  res.render('tracks', { user: req.user, type: 'Random', tracks: tracks, trackdata: trackdata});
});

app.get('/tracks/new',checkNotAuthenticated, async(req,res)=>{
  const { tracks, trackdata } = await getTracks('SELECT * FROM museground.track ORDER BY dateadded DESC LIMIT 5;');
  tracks.forEach(track => {
    track.dateadded = setDate(new Date(track.dateadded));
    track.datecreated = setDate(new Date(track.datecreated));
});
  res.render('tracks', { user: req.user, type: 'New', tracks: tracks, trackdata: trackdata});
});

app.get('/tracks/genres',checkNotAuthenticated, async(req,res)=>{
  const { tracks, trackdata } = await getTracks('SELECT * FROM museground.track ORDER BY genre ASC;');
  tracks.forEach(track => {
    track.dateadded = setDate(new Date(track.dateadded));
    track.datecreated = setDate(new Date(track.datecreated));
});
  res.render('tracks', { user: req.user, type: 'Genres', tracks: tracks, trackdata: trackdata});
});

app.get('/tracks/authors', checkNotAuthenticated, async(req,res)=>{
  const { tracks, trackdata } = await getTracks('SELECT * FROM museground.track ORDER BY author ASC;');
  tracks.forEach(track => {
    track.dateadded = setDate(new Date(track.dateadded));
    track.datecreated = setDate(new Date(track.datecreated));
});
  res.render('tracks', {user: req.user,  type: 'Authors', tracks: tracks, trackdata: trackdata});
});

app.get('/tracks/labels',checkNotAuthenticated,  async(req,res)=>{
  const { tracks, trackdata } = await getTracks('SELECT * FROM museground.track ORDER BY label ASC;');
  tracks.forEach(track => {
    track.dateadded = setDate(new Date(track.dateadded));
    track.datecreated = setDate(new Date(track.datecreated));
});
  res.render('tracks', {user: req.user, type: 'Labels', tracks: tracks, trackdata: trackdata});
});

app.get('/samples',checkNotAuthenticated, async(req,res)=>{
  const {samples, sampledata} = await getSamples(`SELECT * FROM museground.sample`, []);
  res.render('samples', {user: req.user, samples: samples, sampledata: sampledata});
});


app.post('/samples/query',checkNotAuthenticated, async (req, res) => {
  const { instrument, author, key, genre, minbpm, maxbpm } = req.body;
  const conditions = [];
  const values = [];
  console.log(req.body);
  let query = 'SELECT * FROM museground.sample';

  if (instrument) {
    conditions.push('instrument = $' + (conditions.length + 1));
    values.push(instrument);
  }
  if (author) {
    conditions.push('authorname = $' + (conditions.length + 1));
    values.push(author);
  }
  if (key) {
    conditions.push('key = $' + (conditions.length + 1));
    values.push(key);
  }
  if (genre) {
    conditions.push('genre = $' + (conditions.length + 1));
    values.push(genre);
  }
  if (minbpm) {
    conditions.push('bpm >= $' + (conditions.length + 1));
    values.push(minbpm);
  }
  if (maxbpm) {
    conditions.push('bpm <= $' + (conditions.length + 1));
    values.push(maxbpm);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  try {
    console.log(query);
    const { samples, sampledata } = await getSamples(query, values);
    console.log(samples, sampledata);
    res.render('samples', { user: req.user, samples: samples, sampledata: sampledata });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.get('/packs', checkNotAuthenticated, async (req, res) => {
  const { sort } = req.query;

  let orderByClause = '';
  switch (sort) {
    case 'random':
      orderByClause = 'ORDER BY RANDOM()';
      break;
    case 'genres':
      orderByClause = 'ORDER BY genre';
      break;
    case 'price':
      orderByClause = 'ORDER BY price DESC';
      break;
    case 'rating':
      orderByClause = 'ORDER BY rating DESC';
      break;
    case 'author':
      orderByClause = 'ORDER BY author';
      break;
    default:
      orderByClause = ''; // Default sorting, or you can set another default here
  }

  try {
    const packResults = await pool.query(`SELECT * FROM museground.pack ${orderByClause}`);
    const packs = packResults.rows;

    const sampleids = [];
    const samplepaths = [];

    const packPromises = packs.map(async (pack) => {
      const sampleResults = await pool.query(`SELECT * FROM museground.sample WHERE belongto = $1`, [pack.packid]);
      pack.samples = sampleResults.rows;

      pack.samples.forEach(sample => {
        sampleids.push(sample.sampleid);
        samplepaths.push(sample.samplepath);
      });
    });

    await Promise.all(packPromises);

    const sampledata = { sampleids, samplepaths };
    res.render('packs', { user: req.user, packs, sampledata, sort });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});


app.get('/presets',checkNotAuthenticated, async (req, res) => {
  try {
    const presets = await getPresets();
    console.log(presets);
    res.render('presets', { user: req.user, presets, genres, types, plugins });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.get('/presets/:filter/:value',checkNotAuthenticated, async (req, res) => {
  const { filter, value } = req.params;
  console.log(filter, value);
  try {
    const presetsResult = await pool.query(`SELECT * FROM museground.preset WHERE ${filter} = $1`, [value]);
    const presets = presetsResult.rows;

    res.render('presets', {user: req.user, presets, genres, types, plugins });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.get('/plugins',checkNotAuthenticated, async(req,res)=>{
  try {
    const plugins = await getPlugins();
    console.log(plugins);
    res.render('plugins', {user: req.user, plugins, instruments, effects});
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.get('/plugins/instruments',checkNotAuthenticated, async(req,res)=>{
  try {
    const plugins = await getPlugins();
    const instPlugins = plugins.filter((plugin)=>{return plugin.isfx==false;})
    console.log(instPlugins);
    res.render('plugins', {user: req.user, plugins: instPlugins, instruments, effects});
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.get('/plugins/effects',checkNotAuthenticated, async(req,res)=>{
  try {
    const plugins = await getPlugins();
    const fxPlugins = plugins.filter((plugin)=>{return plugin.isfx;})
    console.log(fxPlugins);
    res.render('plugins', {user: req.user, plugins: fxPlugins, instruments, effects});
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.get('/plugins/:filter/:value',checkNotAuthenticated, async (req, res) => {
  const { filter, value } = req.params;
  console.log(filter, value);
  try {
    const pluginsResult = await pool.query(`SELECT * FROM museground.plugin WHERE type = $1`, [value]);
    const plugins = pluginsResult.rows;
    console.log(instruments, effects);
    res.render('plugins', {user: req.user, plugins, instruments, effects});

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
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

app.post("/login",
  passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/login",
    failureFlash: true
  })
);

app.post('/download', checkNotAuthenticated, async (req, res) => {
  const { userid, itemid, itemtype } = req.body;
  const referer = req.get('Referer'); // Get the referring page URL

  try {
    // Insert data into the user_downloads table only if it doesn't already exist
    await pool.query(`
      INSERT INTO museground.user_downloads (userid, itemtype, itemid)
      SELECT $1, $2, $3
      WHERE NOT EXISTS (
        SELECT 1 FROM museground.user_downloads WHERE userid = $1 AND itemtype = $2 AND itemid = $3
      )`, [userid, itemtype, itemid]);
      
    if (itemtype === 'sample') {
      const samplePathResult = await pool.query(
        `SELECT samplepath FROM museground.sample WHERE sampleid = $1`,
        [itemid]
      );
      
      const samplePath = samplePathResult.rows[0].samplepath;
      // Construct the path relative to the "public" directory
      const publicSamplePath = `public${samplePath}`;
      // Download the file
      res.download(publicSamplePath, (err) => {
        if (err) {
          console.error(err);
          res.status(500).send('File download error');
        }
      });
    } else if (itemtype === 'track') {
      const trackPathResult = await pool.query(
        `SELECT trackpath FROM museground.track WHERE trackid = $1`,
        [itemid]
      );
      
      const trackPath = trackPathResult.rows[0].trackpath;
      // Construct the path relative to the "public" directory
      const publicTrackPath = `public${trackPath}`;
      // Download the file
      res.download(publicTrackPath, (err) => {
        if (err) {
          console.error(err);
          res.status(500).send('File download error');
        }
      });
    } else {
      // For non-downloadable items, just redirect back
      res.redirect(referer);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.get('/create/sample', checkNotAuthenticated, async(req,res)=>
{
  res.render('create', {type: 'Sample', user: req.user});
});

app.get('/create/pack', checkNotAuthenticated, async(req,res)=>
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


          res.render("create", {user: req.user, type: 'Pack', samples: samples, sampledata: sampledata});
        }
      }
  )
});

app.get('/create/preset', checkNotAuthenticated, async(req,res)=>
{
  const plugins = await pool.query(`SELECT * FROM museground.plugin`);
  res.render('create', {type: 'Preset', user: req.user, plugins: plugins.rows});
});

app.post('/create/sample', checkNotAuthenticated, upload.single('file'), async (req, res) => {
  const { title, instrument, key, bpm, length, genre } = req.body;
    const audiofile = req.file;

    if (!audiofile) {
      return res.status(400).send('No file uploaded');
    }

    console.log('Request body:', { title, instrument, key, bpm, length, genre });
    console.log('User ID:', req.user.userid);
    
    const id = req.user.userid;
    const newFilePath = path.join(__dirname, 'public', 'samples', title + path.extname(audiofile.originalname));
    const samplePath = '/samples/' + title + path.extname(audiofile.originalname); // Adjusted to use forward slashes

    try {
      fs.renameSync(audiofile.path, newFilePath);
      console.log('File moved to:', newFilePath);
      console.log('Sample path to be stored in DB:', samplePath);
      console.log('User ID to be stored in DB:', id);

      if (!id) {
        return res.status(401).send('User not authenticated or missing user ID');
      }

      const result = await pool.query(
        'INSERT INTO museground.sample (title, instrument, key, bpm, length, genre, samplepath, author) \
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8);',
        [title, instrument, key, bpm, length, genre, samplePath, id]
      );
      res.render('profile', { user: req.user, action: 'User', type: 'Profile' });
    } catch (error) {
      console.error('Error inserting sample:', error);
      res.status(500).send('Server error');
    }
});

app.post('/create/Pack', checkNotAuthenticated, upload.single('file'), async (req, res) => {
  const { title, price, genre, samples } = req.body;
  const imagefile = req.file;

  if (!imagefile) {
    return res.status(400).send('No image file uploaded');
  }

  console.log('Request body:', { title, price, genre, samples });

  const id = req.user.userid;
  const newFilePath = path.join(__dirname, 'public', 'images', title + path.extname(imagefile.originalname));
  const imagePath = '/images/' + title + path.extname(imagefile.originalname);

  try {
    // Move the uploaded image file to the desired location
    fs.renameSync(imagefile.path, newFilePath);

    if (!id) {
      return res.status(401).send('User not authenticated or missing user ID');
    }

    const packResult = await pool.query(
      'INSERT INTO museground.pack (title, price, genre, imagepath, author) VALUES ($1, $2, $3, $4, $5) RETURNING packid;',
      [title, price, genre, imagePath, id]
    );

    const newPackId = packResult.rows[0].packid;
    console.log('New Pack ID:', newPackId);

    if (samples) {
      const sampleArray = Array.isArray(samples) ? samples : [samples];
      const sampleIds = sampleArray.map(sample => JSON.parse(sample).sampleid);

      const updatePromises = sampleIds.map(sampleId => {
        return pool.query(
          'UPDATE museground.sample SET belongto = $1 WHERE sampleid = $2;',
          [newPackId, sampleId]
        );
      });

      await Promise.all(updatePromises);
    }

    res.render('profile', { user: req.user, action: 'User', type: 'Profile' });
  } catch (error) {
    console.error('Error creating pack:', error);
    res.status(500).send('Server error');
  }
});

app.post('/create/Preset', checkNotAuthenticated,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'preset', maxCount: 1 }
  ]),
  async (req, res) => {
    const { title, genres, types, price } = req.body;
    let plugin = req.body.plugin;
    plugin = JSON.parse(plugin);

    const imagefile = req.files['image'];
    const presetfile = req.files['preset'];

    if (!imagefile) {
      return res.status(400).send('No image file uploaded');
    }
    if (!presetfile) {
      return res.status(400).send('No preset file uploaded');
    }

    console.log('Request body:', { title, genres, types, price, plugin });
    console.log('User ID:', req.user.userid);

    const newImagePath = path.join(__dirname, 'public', 'images', title + path.extname(imagefile[0].originalname));
    const imagePath = '/images/' + title + path.extname(imagefile[0].originalname);

    const newPresetPath = path.join(__dirname, 'public', 'presets', title + path.extname(presetfile[0].originalname));
    const presetPath = '/presets/' + title + path.extname(presetfile[0].originalname);

    try {
      fs.renameSync(imagefile[0].path, newImagePath);
      fs.renameSync(presetfile[0].path, newPresetPath);

      console.log('Image moved to:', newImagePath);
      console.log('Preset moved to:', newPresetPath);
      console.log('Image path to be stored in DB:', imagePath);
      console.log('Preset path to be stored in DB:', presetPath);
      console.log('User ID to be stored in DB:', req.user.userid);

      const result = await pool.query(
        'INSERT INTO museground.preset (title, genres, types, price, imagepath, presetpath, pluginid, vst, author, authorname) \
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);',
        [title, genres, types, price, imagePath, presetPath, plugin.vstid, plugin.title, req.user.userid, req.user.username]
      );

      res.redirect('profile', { user: req.user, action: 'User', type: 'Profile' });
    } catch (error) {
      console.error('Error inserting preset:', error);
      res.status(500).send('Server error');
    }
  });

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

function getTracks(query) {
  return new Promise((resolve, reject) => {
    pool.query(query, [], (err, results) => {
      if (err) {
        reject(err);
      } else {
        const tracks = results.rows;
        const trackids = [];
        const trackpaths = [];
        
        tracks.forEach(track => {
          trackids.push(track.trackid);
          trackpaths.push(track.trackpath);
        });
        
        const trackdata = { trackids, trackpaths };
        console.log(tracks, trackdata);
        resolve({ tracks, trackdata });
      }
    });
  });
}

function getSamples(query, params) {
  return new Promise((resolve, reject) => {
    pool.query(query, params, (err, results) => {
      if (err) {
        reject(err);
      } else {
        const samples = results.rows;
        const sampleids = [];
        const samplepaths = [];
        
        samples.forEach(sample => {
          sampleids.push(sample.sampleid);
          samplepaths.push(sample.samplepath);
        });
        
        const sampledata = { sampleids, samplepaths };
        resolve({ samples, sampledata });
      }
    });
  });
}


async function getPresets() {
  try {
    const presetsResult = await pool.query('SELECT * FROM museground.preset');
    const presets = presetsResult.rows;

    let previousGenre = '';
    let previousType = '';
    let previousPlugin = '';

    genres = [];
    types = [];
    plugins = [];

    presets.forEach(preset => {
      if (preset.genres !== previousGenre) {
        genres.push(preset.genres);
        previousGenre = preset.genres;
      }
      if (preset.types !== previousType) {
        types.push(preset.types);
        previousType = preset.types;
      }
      if (preset.vst !== previousPlugin) {
        plugins.push(preset.vst);
        previousPlugin = preset.vst;
      }
    });

    return presets;
  } catch (err) {
    console.error(err);
    throw new Error('Failed to fetch presets');
  }
}

async function getPlugins() {
  try {
    const pluginsResult = await pool.query('SELECT * FROM museground.plugin');
    const plugins = pluginsResult.rows;

    let previousInstrument = '';
    let previousEffect = '';

    instruments = [];
    effects = [];

    plugins.forEach(plugin => {
      if (plugin.type != previousInstrument || plugin.type != previousEffect) {
        if(plugin.isfx==true) {
          effects.push(plugin.type);
          previousEffect = plugin.type;
        }
        else if(plugin.isfx==false) {
          instruments.push(plugin.type);
          previousInstrument = plugin.type;
        }
      }
    });
    instruments = instruments.filter((elem, index, self) => { return index === self.indexOf(elem);})
    effects = effects.filter((elem, index, self) => { return index === self.indexOf(elem);})
    console.log(instruments, effects);

    return plugins;
  } catch (err) {
    console.error(err);
    throw new Error('Failed to fetch plugins');
  }
}

function setDate(date) {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const day = String(date.getDate()).padStart(2, '0');
  return `${day}/${month}/${year}`; // Customize the format as needed
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});