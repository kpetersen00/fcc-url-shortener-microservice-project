require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const URL = require('url').URL;
const dns = require('dns');
const { Schema } = require('mongoose');
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});
// Challenge Code
const urlSchema = new Schema({
  original: { type: String, required: true },
  shortURL: Number,
});
const Url = mongoose.model('Url', urlSchema);
app.use('/api/shorturl', bodyParser.urlencoded({ extended: false }));
app.post('/api/shorturl', (req, res) => {
  const urlObj = {};
  const { url: inputUrl } = req.body;
  let urlObject;
  let short = 1;
  try {
    urlObject = new URL(inputUrl);
  } catch (err) {
    console.log('caught err');
    res.json({ error: 'invalid url' });
  }
  if (urlObject) {
    dns.lookup(urlObject.hostname, (err) => {
      if (err) {
        console.log('lookup err');
        res.json({ error: 'invalid url', original_url: urlObject.hostname });
      } else {
        urlObj.original_url = inputUrl;
        Url.findOne({})
          .sort({ shortURL: 'desc' })
          .exec((err, data) => {
            if (!err && data != undefined) {
              short = data.shortURL + 1;
            }
            if (!err) {
              Url.findOneAndUpdate(
                { original: inputUrl },
                { original: inputUrl, shortURL: short },
                { new: true, upsert: true },
                (err, savedUrl) => {
                  if (!err) {
                    urlObj.short_url = savedUrl.shortURL;
                    res.json(urlObj);
                  }
                }
              );
            }
          });
      }
    });
  }
});
app.get('/api/shorturl/:input', (req, res) => {
  const input = req.params.input;

  Url.findOne({ shortURL: input }, (err, data) => {
    if (!err && data != undefined) {
      res.redirect(data.original);
    }
  });
});
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
