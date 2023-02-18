const express = require('express');
const auth = require('./routes/auth');
const forum = require('./routes/forum')
const user = require('./routes/user');
const session = require('express-session');
const cors = require('cors');
const { urlencoded } = require('express');
const path = require('path');

const app = express();
app.use(cors());
app.use(session({
    secret: 'secretidhere',
    resave: true,
    saveUninitialized: true,
    cookie: { httpOnly: true }
}))
app.use(express.json());
app.use(urlencoded({ extended: true }));

app.use('/auth', auth);
app.use('/forum', forum);
app.use('/user', user);

app.get('/photo/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'images', req.params.id));
});

app.get('/avatar/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'avatars', req.params.id));
});

app.listen(8080);