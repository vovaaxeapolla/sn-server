const userService = require('../services/user-service');
const { validationResult } = require('express-validator');
const ApiError = require('../exceptions/api-error');

class UserController {
    async registration(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(ApiError.BadRequest('Ошибка при валидации', errors.array()));
            }
            const { email, fullname, nickname, password } = req.body;
            const userData = await userService.registration(email, fullname, nickname, password);
            res.cookie('refreshToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
            return res.json(userData);
        } catch (error) {
            next(error);
        }
    }

    async login(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(ApiError.BadRequest('Ошибка при валидации', errors.array()));
            }
            const { email, password } = req.body;
            const userData = await userService.login(email, password);
            res.cookie('refreshToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
            return res.json(userData);
        } catch (error) {
            next(error);
        }
    }

    async logout(req, res, next) {
        try {
            const { refreshToken } = req.cookies;
            const token = await userService.logout(refreshToken);
            res.clearCookie('refreshToken');
            return res.json(token);
        } catch (error) {
            next(error);
        }
    }
    async activate(req, res, next) {
        try {
            const activationLink = req.params.link;
            await userService.activate(activationLink);
            return res.redirect(process.env.CLIENT_URL);
        } catch (error) {
            next(error);
        }
    }
    async refresh(req, res, next) {
        try {
            const { refreshToken } = req.cookies;
            const userData = await userService.refresh(refreshToken);
            res.cookie('refreshToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
            return res.json(userData);
        } catch (error) {
            next(error);
        }
    }

    async changePassword(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(ApiError.BadRequest('Ошибка при валидации', errors.array()));
            }
            const { oldPassword, newPassword } = req.body;
            await userService.changePassword(oldPassword, newPassword, req.user.id);
            return res.status(200);
        } catch (error) {
            next(error);
        }
    }

    async resetPassword(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(ApiError.BadRequest('Ошибка при валидации', errors.array()));
            }
            const { email } = req.body;
            await userService.resetPassword(email);
            return res.status(200);
        } catch (error) {
            next(error);
        }
    }

    async getUser(req, res, next) {
        try {
            const nickname = req.params.nickname;
            const user = await userService.getUser(nickname);
            return res.status(200).json(user);
        } catch (error) {
            next(error);
        }
    }

    async changeAvatar(req, res, next) {
        try {
            const userData = await userService.changeAvatar(req.file.filename, req.user.id);
            return res.status(200).json(userData);
        } catch (error) {
            next(error);
        }
    }

    async following(req, res, next) {
        try {
            const account_id = req.params.id;
            const follower_id = req.user.id;
            const result = await userService.following(follower_id, account_id);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async follow(req, res, next) {
        try {
            const account_id = req.params.id;
            const follower_id = req.user.id;
            if (account_id === follower_id) {
                next(ApiError.BadRequest('Нельзя подписаться на самого себя'));
            }
            await userService.follow(follower_id, account_id);
            return res.status(200).json();
        } catch (error) {
            next(error);
        }
    }

    async unfollow(req, res, next) {
        try {
            const account_id = req.params.id;
            const follower_id = req.user.id;
            await userService.unfollow(follower_id, account_id);
            return res.status(200).json();
        } catch (error) {
            next(error);
        }
    }

    async followersCount(req, res, next) {
        try {
            const account_id = req.params.id;
            const count = await userService.followersCount(account_id);
            return res.status(200).json(count);
        } catch (error) {
            next(error);
        }
    }


    async followingsCount(req, res, next) {
        try {
            const account_id = req.params.id;
            const count = await userService.followingsCount(account_id);
            return res.status(200).json(count);
        } catch (error) {
            next(error);
        }
    }

    async followers(req, res, next) {
        try {
            const account_id = req.params.id;
            const followers = await userService.followers(account_id);
            return res.status(200).json(followers);
        } catch (error) {
            next(error);
        }
    }

    async followings(req, res, next) {
        try {
            const account_id = req.params.id;
            const followings = await userService.followings(account_id);
            return res.status(200).json(followings);
        } catch (error) {
            next(error);
        }
    }

    async deleteAvatar(req, res, next) {
        try {
            await userService.deleteAvatar(req.user.id);
            return res.status(200).json();
        } catch (error) {
            next(error);
        }
    }

    async changePesonalInfo(req, res, next) {
        try {
            const { nickname, fullname } = req.body;
            const userData = await userService.changePesonalInfo(nickname, fullname, req.user.id, req.user.nickname);
            return res.status(200).json(userData);
        } catch (error) {
            next(error);
        }
    }

    async online(req, res, next) {
        try {
            const id = req.user.id;
            const userData = await userService.online(id);
            return res.status(200);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new UserController();