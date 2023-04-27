const db = require('../db');
const events = require('events');
const ApiError = require('../exceptions/api-error');

const emitter = new events.EventEmitter();

class ChatService {

    constructor() {
        this.dialogs = new Map();
    }

    async subscribe(dialogId, userId, res) {
        if ((await db.query(`
        SELECT * FROM chaters
        WHERE user_id = '${userId}' AND dialog_id = '${dialogId}'
        `)).rowCount === 0) {
            throw ApiError.BadRequest('Невозможно выполнить это действие');
        }
        if (this.dialogs.has(dialogId)) {
            const id = Math.random();
            this.dialogs.get(dialogId).set(id, res);
        } else {
            const id = Math.random();
            this.dialogs.set(dialogId, new Map());
            this.dialogs.get(dialogId).set(id, res);
        }

        emitter.once('message', (msg) => {
            for (let id of this.dialogs.get(dialogId).keys()) {
                this.dialogs.get(dialogId).get(id).json(msg);
            }
            this.dialogs.set(dialogId, new Map());

        })
    }

    async publish(dialogId, userId, msg) {
        if ((await db.query(`
        SELECT * FROM chaters
        WHERE user_id = '${userId}' AND dialog_id = '${dialogId}'
        `)).rowCount === 0) {
            throw ApiError.BadRequest('Невозможно выполнить это действие');
        }
        msg = await db.query(`
        INSERT INTO messages 
        VALUES ('${userId}', '${dialogId}', '${Math.round(Date.now() / 1000)}', '${msg}')
        RETURNING * 
        `);
        emitter.emit('message', msg.rows[0]);
    }

    async history(dialogId, userId, offset) {
        if ((await db.query(`
        SELECT * FROM chaters
        WHERE user_id = '${userId}' AND dialog_id = '${dialogId}'
        `)).rowCount === 0) {
            throw ApiError.BadRequest('Невозможно выполнить это действие');
        }
        return (await db.query(`
        SELECT * FROM messages 
        WHERE dialog_id = '${dialogId}'
        OFFSET ${offset}
        `)).rows;

    }

    async chats(searchQuery, nickname) {
        return (await db.query(`
        SELECT * 
        FROM accounts
        JOIN personal_info 
        ON accounts.id = personal_info.user_id
        WHERE accounts.nickname LIKE '${searchQuery}%' AND accounts.nickname != '${nickname}'
        LIMIT 20
        `)).rows;
    }

    async dialogCreate(nickname1, nickname2) {

        const user1 = (await db.query(`
        SELECT * FROM accounts WHERE nickname = '${nickname1}'
        `)).rows[0]
        if (!user1) {
            throw ApiError.BadRequest(`Нет пользователя ${nickname1}`)
        }
        const user2 = (await db.query(`
        SELECT * FROM accounts WHERE nickname = '${nickname2}'
        `)).rows[0]
        if (!user2) {
            throw ApiError.BadRequest(`Нет пользователя ${nickname2}`)
        }

        let dialog = (await db.query(`
        SELECT DISTINCT dialogs.id
        FROM dialogs
        JOIN chaters 
        ON dialogs.id = chaters.dialog_id
        JOIN accounts 
        ON accounts.id = chaters.user_id
        INNER JOIN (
            SELECT DISTINCT dialogs.id as id
            FROM dialogs
            JOIN chaters 
            ON dialogs.id = chaters.dialog_id
            JOIN accounts 
            ON accounts.id = chaters.user_id
            WHERE nickname = '${nickname2}'
        ) as d ON d.id = dialogs.id 
        WHERE nickname = '${nickname1}'
        `)).rows[0]

        if (dialog)
            return dialog.id;

        dialog = (await db.query(`
        INSERT INTO dialogs (name)
        VALUES ('${nickname1} и ${nickname2}')
        RETURNING *
        `)).rows[0];

        await db.query(`
        INSERT INTO chaters
        VALUES ('${dialog.id}', '${user1.id}')
        `);

        await db.query(`
        INSERT INTO chaters
        VALUES ('${dialog.id}', '${user2.id}')
        `);

        return dialog.id;
    }

    async dialogsGet(id) {
        return (await db.query(`
        SELECT d.id, p.avatar, p.fullname, a.nickname, m.text, m.date FROM chaters as c
        JOIN(
            SELECT dialogs.id FROM dialogs
            JOIN chaters as c ON c.dialog_id = dialogs.id
            WHERE c.user_id = '${id}'
            ) as d ON d.id = c.dialog_id
            JOIN accounts as a ON a.id = c.user_id
            JOIN personal_info as p ON p.user_id = c.user_id
            JOIN messages as m ON m.dialog_id = d.id
            WHERE c.user_id != '${id}' AND m.date = (SELECT MAX(messages.date) FROM messages WHERE d.id = messages.dialog_id)
        `)).rows;
    }

    async dialogGet(id, userId) {
        return (await db.query(`
        SELECT d.id, p.avatar, p.fullname, a.nickname FROM dialogs as d
        JOIN chaters as c ON c.dialog_id = d.id
        JOIN accounts as a ON a.id = c.user_id
        JOIN personal_info as p ON p.user_id = c.user_id
        WHERE d.id = '${id}' AND a.id != '${userId}'
        `)).rows[0];
    }
}


module.exports = new ChatService();