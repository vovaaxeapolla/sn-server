module.exports = class UserDto {
    id;
    isActivated;
    nickname;
    fullname;
    avatar;
    constructor(model) {
        this.id = model.id;
        this.isActivated = model.is_activated;
        this.nickname = model.nickname;
        this.fullname = model.fullname
        this.avatar = model.avatar;
    }
}