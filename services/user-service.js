const db = require('../db');
const bcrypt = require('bcrypt');
const uuid = require('uuid');
const mailService = require('./mail-service');
const tokenService = require('./token-service');
const fs = require('fs');
const UserDto = require('../dtos/user-dto');
const AccountDto = require('../dtos/account-dto');
const ApiError = require('../exceptions/api-error');
const path = require('path');

async function getOneUser({ id, nickname }) {
    let condition = '';
    if (id) {
        condition = `id = '${id}'`
    }
    if (nickname) {
        condition = `nickname = '${nickname}'`
    }
    const user = (await db.query(`
    SELECT * 
    FROM accounts
    LEFT JOIN personal_info
    ON user_id = id 
    WHERE ${condition}
    `
    )).rows[0];
    if (!user) {
        return false;
    }
    return user;
}

async function updateAvatar(filename, id) {
    return await db.query(`
    UPDATE personal_info
    SET avatar = '${filename}'
    WHERE user_id = '${id}'
    RETURNING *
    `);
}

async function deleteAvatar(filename) {
    if (filename !== 'default.png')
        fs.unlink(path.join(__dirname, '..', 'images', 'avatars', filename), (e) => console.log(e));
}

class UserService {
    async registration(email, fullname, nickname, password) {
        const candidate = await db.query(`SELECT * FROM accounts WHERE email = '${email}' OR nickname = '${nickname}'`);
        if (candidate.rowCount !== 0) {
            if (candidate.rows[0].email === email)
                throw ApiError.BadRequest(`Эта почта уже зарегистрирована"`);
            if (candidate.rows[0].nickname === nickname)
                throw ApiError.BadRequest(`Это имя пользователя уже занято"`);
        }
        const hashPassword = await bcrypt.hash(password, 5);
        const activationLink = uuid.v4();

        const user = (await db.query(`
        INSERT INTO accounts (email, password, is_activated, activation_link, nickname) 
        VALUES ('${email}','${hashPassword}','false','${activationLink}', '${nickname}') 
        RETURNING *`
        )).rows[0];

        await db.query(`INSERT INTO personal_info (user_id) VALUES('${user.id}')`);

        const personal_info = (await db.query(`
        SELECT * FROM personal_info WHERE user_id = ${user.id}`
        )).rows[0];

        db.query(`
        INSERT INTO online (online, 'date') VALUES('true', ${Math.round(Date.now())}
        `)

        await mailService.sendActivationMail(email, `${process.env.API_URL} /api/activate / ${activationLink} `);

        const userDto = new UserDto({ ...user, ...personal_info });
        const tokens = tokenService.generateTokens({ ...userDto });
        await tokenService.saveToken(userDto.id, tokens.refreshToken);

        return { ...tokens, user: userDto };
    }

    async activate(activationLink) {
        const user = await db.query(`SELECT * FROM accounts WHERE activation_link = '${activationLink}'`);
        if (user.rowCount === 0) {
            throw ApiError.BadRequest('Некорректная ссылка активации');
        }
        await db.query(`
        UPDATE accounts 
        SET is_activated = 'true' 
        WHERE activation_link = '${activationLink}'
    `);
    }

    async login(email, password) {
        const user = (await db.query(`SELECT * FROM accounts WHERE email = '${email}'`)).rows[0];
        if (!user) {
            throw ApiError.BadRequest(`Пользователь с такой почтой не найден`);
        }
        const isPassEquals = await bcrypt.compare(password, user.password);
        if (!isPassEquals) {
            throw ApiError.BadRequest('Неверный пароль');
        }

        const personal_info = (await db.query(`
SELECT * FROM personal_info WHERE user_id = ${user.id} `
        )).rows[0];

        const userDto = new UserDto({ ...user, ...personal_info });
        const tokens = tokenService.generateTokens({ ...userDto });
        await tokenService.saveToken(userDto.id, tokens.refreshToken);

        return { ...tokens, user: userDto };
    }

    async logout(refreshToken) {
        const token = await tokenService.removeToken(refreshToken);
        return token;
    }

    async refresh(refreshToken) {
        if (!refreshToken) {
            throw ApiError.UnauthorizedError();
        }
        const userData = tokenService.validateRefreshToken(refreshToken);
        const tokenFromDb = await tokenService.findToken(refreshToken);
        if (!userData || !tokenFromDb) {
            throw ApiError.UnauthorizedError();
        }
        const user = (await db.query(`SELECT * FROM accounts WHERE id = '${userData.id}'`)).rows[0];
        const personal_info = (await db.query(`
SELECT * FROM personal_info WHERE user_id = ${user.id} `
        )).rows[0];

        const userDto = new UserDto({ ...user, ...personal_info });
        const tokens = tokenService.generateTokens({ ...userDto });
        await tokenService.saveToken(userDto.id, tokens.refreshToken);

        return { ...tokens, user: userDto };
    }

    async resetPassword(email) {
        const user = (await db.query(`SELECT * FROM accounts WHERE email = '${email}'`)).rows[0];
        if (!user) {
            throw ApiError.BadRequest('Такая почта не зарегистрирована');
        }
        const newPassword = Math.random().toString(36).slice(-8);
        const hash = await bcrypt.hash(newPassword, 5);
        await db.query(`UPDATE accounts SET password = '${hash}' WHERE email = '${email}'`);
        await mailService.sendNewPassword(email, newPassword);
    }

    async changePassword(oldPassword, newPassword, id) {
        const user = (await db.query(`SELECT * FROM accounts WHERE id = '${id}'`)).rows[0];
        const isValid = await bcrypt.compare(oldPassword, user.password);
        if (!isValid) {
            throw ApiError.BadRequest('Неверный пароль');
        }
        const hash = await bcrypt.hash(newPassword, 5);
        await db.query(`UPDATE accounts SET password = '${hash}' WHERE id = '${id}'`);
    }


    async getUser(nickname) {
        const user = await getOneUser({ nickname });
        if (!user) {
            throw ApiError.BadRequest('Пользователь не найден');
        }
        const personal_info = (await db.query(`
SELECT * FROM personal_info WHERE user_id = '${user.id}'`
        )).rows[0];
        const userDto = new UserDto({ ...user, ...personal_info });
        return userDto;
    }

    async follow(follower_id, account_id) {
        let id = account_id;
        const user = await getOneUser({ id });
        if (!user) {
            throw ApiError.BadRequest('Пользователь не найден');
        }
        await db.query(`INSERT INTO followers VALUES(${follower_id}, ${account_id})`);
    }

    async unfollow(follower_id, account_id) {
        await db.query(`DELETE FROM followers WHERE follower_id = ${follower_id} AND account_id = ${account_id} `);
    }

    async following(follower_id, account_id) {
        return !!(await db.query(`
SELECT *
    FROM followers 
        WHERE follower_id = ${follower_id} AND account_id = ${account_id} `
        )).rows[0];
    }

    async followersCount(account_id) {
        return (await db.query(`SELECT COUNT(*) as count FROM followers WHERE account_id = ${account_id} `)).rows[0];
    }

    async followingsCount(account_id) {
        return (await db.query(`SELECT COUNT(*) as count FROM followers WHERE follower_id = ${account_id} `)).rows[0];
    }

    async followers(account_id) {
        const followers = (await db.query(`
        SELECT accounts.id, personal_info.avatar, personal_info.fullname, accounts.nickname
        FROM followers 
        JOIN accounts ON accounts.id = follower_id
        JOIN personal_info ON user_id = follower_id
        WHERE account_id = ${account_id} `
        )).rows;
        if (!followers)
            return [];
        return followers.map(f => new AccountDto({ ...f }));
    }

    async followings(account_id) {
        console.log(12);
        const followings = (await db.query(`
        SELECT accounts.id, personal_info.avatar, personal_info.fullname, accounts.nickname
        FROM followers 
        JOIN accounts ON accounts.id = account_id
        JOIN personal_info ON user_id = account_id
        WHERE follower_id = ${account_id} `
        )).rows;
        if (!followings)
            return [];
        return followings.map(f => new AccountDto({ ...f }));
    }

    async changeAvatar(fileName, id) {
        const user = await getOneUser({ id });
        await deleteAvatar(user.avatar);
        await updateAvatar(fileName, id);
        user.avatar = fileName;

        const personal_info = (await db.query(`
SELECT * FROM personal_info WHERE user_id = ${user.id} `
        )).rows[0];

        const userDto = new UserDto({ ...user, ...personal_info });
        return userDto;
    }

    async deleteAvatar(id) {
        const user = await getOneUser({ id });
        await deleteAvatar(user.avatar);
        const update = await updateAvatar('default.png', id);
        user.avatar = update.rows[0].avatar;
        const userDto = new UserDto({ ...user });
        return userDto;
    }

    async changePesonalInfo(newNickname, fullname, id, oldNickname) {
        let user = await getOneUser({ nickname: newNickname });
        if (user && newNickname !== oldNickname) {
            throw ApiError.BadRequest('Этот никнейм уже занят');
        }

        await db.query(`UPDATE accounts SET nickname = '${newNickname}' WHERE id = '${id}'`);
        await db.query(`UPDATE personal_info SET fullname = '${fullname}' WHERE user_id = '${id}'`);

        user = await getOneUser({ id });
        const personal_info = (await db.query(`
SELECT * FROM personal_info WHERE user_id = ${id} `
        )).rows[0];

        const userDto = new UserDto({ ...user, ...personal_info });
        return userDto;
    }

    async online(id) {
        //db.query('UPDATE')
    }
}

module.exports = new UserService();