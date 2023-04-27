module.exports = class CommentDto {
    avatar;
    text;
    nickname;
    date;
    constructor(model) {
        this.text = model.text;
        this.nickname = model.nickname;
        this.date = model.date
        this.avatar = model.avatar;
    }
}