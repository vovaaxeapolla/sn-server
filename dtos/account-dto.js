module.exports = class AccountsDto {
    id;
    nickname;
    fullname;
    avatar;
    constructor(model) {
        this.id = model.id;
        this.nickname = model.nickname;
        this.fullname = model.fullname
        this.avatar = model.avatar;
    }
}