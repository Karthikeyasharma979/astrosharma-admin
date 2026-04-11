const nodemailer = require('nodemailer');

let cachedTransporter = null;

const getMailConfig = () => {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    if (!host || !user || !pass) {
        const error = new Error('Missing SMTP configuration. Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS.');
        error.code = 'MAIL_CONFIG_MISSING';
        throw error;
    }

    return { host, port, user, pass, secure };
};

const getTransporter = () => {
    if (cachedTransporter) {
        return cachedTransporter;
    }

    const config = getMailConfig();

    cachedTransporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
            user: config.user,
            pass: config.pass,
        },
    });

    return cachedTransporter;
};

const sendBookingConfirmationEmail = async (booking) => {
    const transporter = getTransporter();

    const from = process.env.MAIL_FROM || process.env.SMTP_USER;
    const to = booking.email;

    if (!to) {
        const error = new Error('Booking email address is missing.');
        error.code = 'MAIL_TO_MISSING';
        throw error;
    }

    const consultation = booking.consultationType || 'Astrology Consultation';

    return transporter.sendMail({
        from,
        to,
        subject: 'Your booking is confirmed - AstroAdmin',
        text: `Hello ${booking.fullName || 'Customer'},\n\nYour booking has been confirmed.\n\nConsultation Type: ${consultation}\nBooking ID: ${booking._id}\nOrder ID: ${booking.razorpay_order_id || 'N/A'}\nStatus: ${booking.status || 'Pending'}\n\nThank you for choosing us.`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                <h2 style="margin-bottom: 8px;">Booking Confirmation</h2>
                <p>Hello ${booking.fullName || 'Customer'},</p>
                <p>Your booking has been confirmed successfully.</p>
                <table style="border-collapse: collapse; margin: 16px 0;">
                    <tr>
                        <td style="padding: 6px 10px; border: 1px solid #e5e7eb;"><strong>Consultation Type</strong></td>
                        <td style="padding: 6px 10px; border: 1px solid #e5e7eb;">${consultation}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 10px; border: 1px solid #e5e7eb;"><strong>Booking ID</strong></td>
                        <td style="padding: 6px 10px; border: 1px solid #e5e7eb;">${booking._id}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 10px; border: 1px solid #e5e7eb;"><strong>Order ID</strong></td>
                        <td style="padding: 6px 10px; border: 1px solid #e5e7eb;">${booking.razorpay_order_id || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 10px; border: 1px solid #e5e7eb;"><strong>Status</strong></td>
                        <td style="padding: 6px 10px; border: 1px solid #e5e7eb;">${booking.status || 'Pending'}</td>
                    </tr>
                </table>
                <p>Thank you for choosing us.</p>
            </div>
        `,
    });
};

module.exports = {
    sendBookingConfirmationEmail,
};
