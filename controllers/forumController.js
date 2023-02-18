const db = require('../db');

class forumController {
    async getPosts(req, res) {
        const limit = req.query.limit || 5;
        const offset = req.query.offset || 0;
        const query = `
        SELECT posts.id, date, text, image, name, surname, nickname, avatar 
        FROM posts 
        JOIN users 
        ON posts.authorid = users.id 
        ORDER BY date 
        DESC 
        LIMIT ${limit} 
        OFFSET ${offset} 
        `;
        const posts = await db.query(query);
        return res.send(JSON.stringify(posts.rows));
    }

    async createPost(req, res) {
        const { text } = req.body;
        let filename = '';
        if (req.file?.filename) {
            filename = req.file.filename;
        }
        await db.query(`INSERT INTO posts (authorid, date, text, image) VALUES (${req.session.userid}, to_timestamp(${Date.now()} / 1000.0),'${text}','${filename}')`);
        return;
    }

    async addComment(req, res) {    
        try {
            const { postid, text } = req.body;
            const query = `INSERT INTO postcomments (postid, authorid, date, text) VALUES ('${postid}',${req.session.userid}, to_timestamp(${Date.now()} / 1000.0),'${text}')`;
            await db.query(query);
            return;
        } catch (error) {
            console.log(error);
        }
    }

    async getComments(req, res) {
        try {
            const { postid } = req.params;
            if (postid) {
                const query = `
                SELECT postcomments.id, users.nickname, date, text, users.name, users.surname 
                FROM postcomments 
                JOIN users 
                ON postcomments.authorid = users.id
                WHERE postid = '${postid}'`;
                const result = await db.query(query);
                return res.json(result.rows);
            } else {
                return res.status(404).json({ message: 'Нет коментариев' });
            }
        } catch (error) {
            console.log(error);
        }
    }

}

module.exports = new forumController();