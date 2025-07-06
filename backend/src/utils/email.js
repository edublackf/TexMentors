const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');

const sendEmail = async (options) => {
    // 1) Configurar el transporter (el servicio que enviará el email)
    const transporterOptions = {
        auth: {
            api_key: process.env.SENDGRID_API_KEY
        }
    };
    const transporter = nodemailer.createTransport(sgTransport(transporterOptions));

    // 2) Definir las opciones del email
    const mailOptions = {
        from: `TexMentors <${process.env.EMAIL_FROM}>`,
        to: options.email,
        subject: options.subject,
        text: options.message, // Para clientes de email que no renderizan HTML
        html: options.html // El cuerpo del email en HTML
    };

    // 3) Enviar el email
    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully!');
    } catch (error) {
        console.error('Error sending email:', error);
        if (error.response) {
            console.error(error.response.body);
        }

        throw new Error('Hubo un error al enviar el email. Inténtelo de nuevo más tarde.');
    }
};

module.exports = sendEmail;