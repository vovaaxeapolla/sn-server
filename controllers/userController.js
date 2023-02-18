const db = require('../db');

class userController {

    async getUser(req, res) {
        const { nickname } = req.params;
        const result = await db.query(`SELECT name, surname, nickname, avatar FROM users WHERE nickname = '${nickname}'`);
        const data = result.rows[0];
        return res.json(data);
    }

    async updateUser(req, res) {
        // console.log(req.body, req.file);
        // const { text } = req.body;
        let filename = '';
        if (req.file?.filename) {
            filename = req.file.filename;
        }
        const query = `
        UPDATE users 
        SET avatar = '${filename}'
        WHERE id = '${req.session.userid}'`;
        await db.query(query);
        return;
    }
}

module.exports = new userController();