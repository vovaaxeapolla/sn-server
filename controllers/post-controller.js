const postService = require('../services/post-service');
const ApiError = require('../exceptions/api-error');

class PostController {
    async createPost(req, res, next) {
        try {
            const { text } = req.body;
            const author = req.user.id;
            const files = req.files;
            await postService.createPost(author, text, files);
            return res.status(200).json();
        } catch (error) {
            next(error);
        }
    }

    async getPosts(req, res, next) {
        try {
            const posts = await postService.getPosts();
            return res.status(200).json(posts);
        } catch (error) {
            next(error);
        }
    }

    async getPostsCount(req, res, next) {
        try {
            const author_id = req.params.id;
            const count = await postService.getPostsCount(author_id);
            return res.status(200).json(count);
        } catch (error) {
            next(error);
        }
    }

    async deletePost(req, res, next) {
        try {
            const id = req.params.id;
            const authorId = req.user.id
            await postService.deletePost(id, authorId);
            return res.status(200).json();
        } catch (error) {
            next(error);
        }
    }

    async createComment(req, res, next) {
        try {
            const { post_id, text } = req.body;
            const authorId = req.user.id
            await postService.createComment(post_id, authorId, text);
            return res.status(200).json();
        } catch (error) {
            next(error);
        }
    }

    async getComments(req, res, next) {
        try {
            const post_id = req.params.id;
            const comments = await postService.getComments(post_id);
            return res.status(200).json(comments);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new PostController();