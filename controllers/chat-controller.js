
const chatService = require('../services/chat-service');



class ChatController {

    async chats(req, res, next) {
        try {
            const nickname = req.user.nickname;
            const searchQuery = req.query.searchQuery;
            const chats = await chatService.chats(searchQuery, nickname);
            return res.json(chats);
        } catch (error) {
            next(error);
        }
    }

    async subscribe(req, res, next) {
        try {
            const chatId = req.params.id;
            const userId = req.user.id;
            await chatService.subscribe(chatId, userId, res);
        } catch (error) {
            next(error);
        }
    }

    async publish(req, res, next) {
        try {
            const chatId = req.params.id;
            const userId = req.user.id;
            const { msg } = req.body;
            await chatService.publish(chatId, userId, msg);
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    }

    async history(req, res, next) {
        try {
            const chatId = req.params.id;
            const userId = req.user.id;
            const { offset } = req.body;
            res.json(await chatService.history(chatId, userId, offset));
        } catch (error) {
            next(error);
        }
    }

    async dialogCreate(req, res, next) {
        try {
            const nickname1 = req.user.nickname
            const nickname2 = req.body.nickname;
            const chatId = await chatService.dialogCreate(nickname1, nickname2);
            return res.json({ chatId });
        } catch (error) {
            next(error);
        }
    }

    async dialogsGet(req, res, next) {
        try {
            const id = req.params.id;
            const dialogs = await chatService.dialogsGet(id);
            return res.json(dialogs);
        } catch (error) {
            next(error);
        }
    }

    async dialogGet(req, res, next) {
        try {
            const id = req.params.id;
            const userId = req.user.id
            const dialog = await chatService.dialogGet(id, userId);
            return res.json(dialog);
        } catch (error) {
            next(error);
        }
    }

}

module.exports = new ChatController();