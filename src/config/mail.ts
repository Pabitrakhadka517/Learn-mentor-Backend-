import dotenv from 'dotenv';
dotenv.config();

export const mailConfig = {
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT || '587'),
    secure: process.env.MAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
    from: process.env.MAIL_FROM || '"LearnMentor" <support@learnmentor.com>',
};
