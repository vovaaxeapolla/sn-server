const nodemailer = require('nodemailer');

class MailService {

    constructor() {
        this.transporter = nodemailer.createTransport(
            {
                host: process.env.SMTP_HOST,
                post: process.env.SMTP_PORT,
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD,
                }
            }
        )
    }

    async sendActivationMail(to, link) {
        await this.transporter.sendMail({
            from: process.env.SMTP_USER,
            to,
            subject: 'Активация аккаунта на ' + process.env.API_URL,
            text: '',
            html:
                `
                <div>
                    <h3>Для активации перейдите по ссылке</h3>
                    <a href="${link}">${link}</a>
            `
        })
    }

    async sendNewPassword(to, newPassword) {
        await this.transporter.sendMail({
            from: process.env.SMTP_USER,
            to,
            subject: 'Восстановление пароля на ' + process.env.API_URL,
            text: '',
            html:
                `
                <div>
                    <h1>Ваш новый пароль</h1>
                    <h3>${newPassword}</h3>
            `
        })
    }
}

module.exports = new MailService();