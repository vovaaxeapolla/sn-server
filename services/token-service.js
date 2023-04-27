const jwt = require('jsonwebtoken');
const db = require('../db');

class TokenService {
    generateTokens(payload) {
        const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '30m' });
        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
        return {
            accessToken,
            refreshToken
        }
    }

    async saveToken(userId, refreshToken) {

        const tokenData = await db.query(`
        SELECT * 
        FROM refresh_tokens 
        WHERE user_id = '${userId}'`
        );

        if (tokenData.rowCount !== 0) {
            const newRefreshToken = refreshToken;
            return await db.query(`
            UPDATE refresh_tokens 
            SET refresh_token = '${newRefreshToken}' 
            WHERE user_id = ${userId}
            RETURNING *`
            );
        }

        const token = await db.query(`
        INSERT INTO refresh_tokens
        VALUES (${userId}, '${refreshToken}')
        RETURNING *
        `);

        return token;
    }

    async removeToken(refreshToken) {
        const tokenData = await db.query(`DELETE FROM refresh_tokens WHERE refresh_token = '${refreshToken}' RETURNING *`);
        return tokenData.rows[0];
    }

    validateAccessToken(token) {
        try {
            const userData = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            return userData;
        } catch (error) {
            return null;
        }
    }

    validateRefreshToken(token) {
        try {
            const userData = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
            return userData;
        } catch (error) {
            return null;
        }
    }

    async findToken(token) {
        const tokenData = await db.query(`SELECT * FROM refresh_tokens WHERE refresh_token = '${token}'`);
        return tokenData.rows[0];
    }

}

module.exports = new TokenService();