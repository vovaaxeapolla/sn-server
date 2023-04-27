const db = require('../db');
const PostDto = require('../dtos/post-dto');
const CommentDto = require('../dtos/comment-dto');
const fs = require('fs');
const path = require('path');
const ApiError = require('../exceptions/api-error');

async function deletePhotos(photos) {
    photos.forEach(photo => {
        fs.unlink(path.join(__dirname, '..', 'images', 'photos', photo), (e) => console.log(e));
    });
}

class PostService {
    async createPost(authorId, text, files) {
        const postId = (await db.query(`
        INSERT INTO posts (author_id,${text ? `text,` : ''} date) 
        VALUES('${authorId}',${text ? `'${text}',` : ''}'${Math.round(Date.now() / 1000)}')
        RETURNING id
        `)).rows[0].id;
        let values = files.map(f => `('${postId}','${f.filename}')`);
        if (values?.length) {
            await db.query(`
        INSERT INTO posts_images
        VALUES ${values.join(', ')}
        `);
        }
    }

    async getPosts() {
        const posts = await db.query(`
        SELECT DISTINCT posts.*, accounts.nickname, avatar, (SELECT string_agg(value , ',') as photos
        FROM posts_images 
        WHERE post_id = posts.id) 
        FROM posts
        JOIN accounts 
        ON accounts.id = author_id
        JOIN personal_info 
        ON user_id = accounts.id
        ORDER BY date DESC
        `);
        return posts.rows.map(p => new PostDto({ ...p }));
    }

    async getPostsCount(author_id) {
        return (await db.query(`SELECT COUNT(*) as count FROM posts WHERE author_id = ${author_id}`)).rows[0];
    }

    async deletePost(id, authorId) {
        const post = (await db.query(`
        SELECT *
        FROM posts 
        WHERE id = '${id}' AND author_id = '${authorId}'
        `)).rows[0]
        if (!post) {
            throw ApiError.BadRequest('Невозможно удалить этот пост');
        }
        const photos = (await db.query(`
        SELECT string_agg(value , ',') as photos
        FROM posts_images 
        WHERE post_id = ${id}
        `)).rows[0].photos;
        if (photos !== null) {
            deletePhotos(photos.split(','));
            await db.query(`
            DELETE FROM posts_images
            WHERE post_id = ${id}
            `);
        }
        await db.query(`
        DELETE FROM posts
        WHERE id = ${id}
        `);
        await db.query(`
        DELETE FROM comments
        WHERE post_id = ${id}
        `);
    }

    async createComment(post_id, author_id, text) {
        const comment = (await db.query(`
        INSERT INTO comments
        VALUES ('${author_id}','${post_id}','${text}','${Math.round(Date.now() / 1000)}')
        RETURNING *
                `)).rows[0]
    }

    async getComments(post_id) {
        const comments = (await db.query(`
        SELECT avatar, nickname, comments.text, comments.date 
        FROM comments
        JOIN accounts ON comments.author_id = accounts.id
        JOIN personal_info ON personal_info.user_id = accounts.id
        WHERE comments.post_id = ${post_id}
                `)).rows
        const commentsDto = comments.map(c => new CommentDto({ ...c }));
        return commentsDto;
    }
}

module.exports = new PostService();