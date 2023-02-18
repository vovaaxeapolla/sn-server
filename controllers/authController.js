const bcrypt = require('bcrypt');
const uuid = require('uuid').v4;
const db = require('../db');

const validateEmail = (email) => {
    return String(email)
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
};

class authController {
    async registration(req, res) {
        try {
            const { email, password, name, surname } = req.body;
            if (email) {
                const candidate = await db.query(`SELECT * FROM users WHERE email = '${email}'`);
                if (candidate.rows.length === 0) {
                    const hashedPassword = await bcrypt.hash(password, 5);
                    const query = `
                    INSERT INTO users (email,password,name,surname, nickname) 
                    VALUES('${email}','${hashedPassword}','${name}','${surname}','${uuid().slice(0, 16)}') 
                    RETURNING id, name, surname, nickname`;
                    const result = await db.query(query);
                    const user = result.rows[0];
                    req.session.auth = true;
                    req.session.userid = user.id;
                    req.session.admin = true;
                    return res.status(200).json({ name: user.name, surname: user.surname, nickname: user.nickname });
                }
                return res.status(400).json({ message: "Пользователь с таким именем уже существует" })
            } else {
                return res.status(400).json({ message: "Неверный логин!" })
            }
        } catch (e) {
            console.log(e)
            res.status(400).json({ message: 'Registration error' })
        }
    }

    async login(req, res) {
        if (!req.body.email || !req.body.password) {
            return res.status(400).send('login failed');

        } else {
            const { email, password } = req.body;
            if (!validateEmail(email))
                return res.status(400).json({ message: 'Неверный пароль или логин' });
            const candidate = await db.query(`SELECT * FROM users WHERE email = '${email}'`);
            if (candidate.rows[0] && bcrypt.compareSync(password, candidate.rows[0].password)) {
                const user = candidate.rows[0];
                req.session.auth = true;
                req.session.userid = user.id;
                req.session.admin = true;
                return res.status(200).json({ name: user.name, surname: user.surname, nickname: user.nickname });
            } else {
                return res.status(400).json({ message: 'Неверный пароль или логин' });
            }
        }
    }

    async logout(req, res) {
        req.session.auth = false;
        req.session.userid = null;
        res.status(200).send();
    }

    async isAuth(req, res) {
        if (req.session && req.session.auth) {
            const data = await db.query(`SELECT name, surname, nickname, avatar FROM users WHERE id = '${req.session.userid}'`);
            const user = data.rows[0];
            return res.status(200).json({ ...user });
        }
        return res.status(401).send();
    }

}

module.exports = new authController();