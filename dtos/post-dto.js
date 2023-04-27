module.exports = class PostDto {
    id;
    text;
    nickname;
    date;
    photos;
    avatar;
    constructor(model) {
        this.id = model.id;
        this.text = model.text;
        this.nickname = model.nickname;
        this.date = model.date
        this.photos = model.photos;
        this.avatar = model.avatar;
    }
}