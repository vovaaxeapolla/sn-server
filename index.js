require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors')
const cookieParser = require('cookie-parser');
const api = require('./router/api');
const errorMiddleware = require('./middlewares/error-middleware');
const path = require('path');

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL
}));
app.use('/api', api);
app.use(errorMiddleware);

app.get("/images/:filetype/:filename", (req, res) => {
    const filename = req.params.filename;
    const filetype = req.params.filetype;
    return res.sendFile(path.join(__dirname, "images", filetype, filename));
});

app.listen(PORT, () => console.log(PORT))
