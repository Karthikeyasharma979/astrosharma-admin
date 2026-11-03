const nodemailer = require('nodemailer');

let cachedTransporter = null;

// Customer names and astrologer notes are plain text, so they can't be allowed to act as HTML in the email
const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

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
        subject: 'Your booking is confirmed - AstroSharma',
        text: `Hello ${booking.fullName || 'Customer'},\n\nYour booking has been confirmed.\n\nConsultation Type: ${consultation}\nBooking ID: ${booking._id}\nOrder ID: ${booking.razorpay_order_id || 'N/A'}\nStatus: ${booking.status || 'Pending'}\n\nThank you for choosing us.`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                <h2 style="margin-bottom: 8px;">Booking Confirmation</h2>
                <p>Hello ${escapeHtml(booking.fullName || 'Customer')},</p>
                <p>Your booking has been confirmed successfully.</p>
                <table style="border-collapse: collapse; margin: 16px 0;">
                    <tr>
                        <td style="padding: 6px 10px; border: 1px solid #e5e7eb;"><strong>Consultation Type</strong></td>
                        <td style="padding: 6px 10px; border: 1px solid #e5e7eb;">${escapeHtml(consultation)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 10px; border: 1px solid #e5e7eb;"><strong>Booking ID</strong></td>
                        <td style="padding: 6px 10px; border: 1px solid #e5e7eb;">${booking._id}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 10px; border: 1px solid #e5e7eb;"><strong>Order ID</strong></td>
                        <td style="padding: 6px 10px; border: 1px solid #e5e7eb;">${escapeHtml(booking.razorpay_order_id || 'N/A')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 10px; border: 1px solid #e5e7eb;"><strong>Status</strong></td>
                        <td style="padding: 6px 10px; border: 1px solid #e5e7eb;">${escapeHtml(booking.status || 'Pending')}</td>
                    </tr>
                </table>
                <p>Thank you for choosing us.</p>
            </div>
        `,
    });
};

const sendConsultationSummaryEmail = async (booking, remedies = {}, options = {}) => {
    try {
        const transporter = getTransporter();
        const from = process.env.MAIL_FROM || process.env.SMTP_USER || 'consultations@astrosharma.me';
        const to = booking.email;

        if (!to) {
            console.warn('Cannot send email: Booking email address is missing.');
            return { skipped: true, reason: 'No email address' };
        }

        const clientHostUrl = (process.env.CLIENT_URL || process.env.VITE_CLIENT_URL || 'https://astrosharma.me').replace(/\/$/, '');
        const reviewUrl = `${clientHostUrl}/review?bookingId=${booking._id}&name=${encodeURIComponent(booking.fullName || '')}`;
        const consultation = escapeHtml(booking.consultationType || 'Astrology Consultation');
        const clientName = escapeHtml(booking.fullName || 'Valued Client');
        const formattedDate = new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const subject = `Your Astrology Consultation Summary & Vedic Remedies - AstroSharma`;

        const html = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: #ffffff;">
                <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
                    <h1 style="margin: 0 0 8px 0; font-size: 24px; letter-spacing: -0.5px;">AstroSharma Vedic Consultation</h1>
                    <p style="margin: 0; font-size: 14px; opacity: 0.9;">Consultation Summary & Astrological Remedies (పరిహారాలు)</p>
                </div>

                <div style="padding: 28px 24px;">
                    <p style="font-size: 16px; margin-top: 0;">Namaste <strong>${clientName}</strong>,</p>
                    <p style="color: #475569;">Thank you for attending your <strong>${consultation}</strong> session on <strong>${formattedDate}</strong>. Below is the summary of your consultation and the sacred remedies prescribed by the Acharya.</p>

                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin: 20px 0;">
                        <h3 style="margin: 0 0 12px 0; color: #334155; font-size: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Session Overview</h3>
                        <p style="margin: 4px 0; font-size: 13px;"><strong>Consultation:</strong> ${consultation}</p>
                        ${booking.callDuration ? `<p style="margin: 4px 0; font-size: 13px;"><strong>Session Duration:</strong> ${escapeHtml(booking.callDuration)}</p>` : ''}
                        ${booking.followUpDate ? `<p style="margin: 4px 0; font-size: 13px;"><strong>Scheduled Follow-Up:</strong> ${new Date(booking.followUpDate).toLocaleDateString('en-IN')}</p>` : ''}
                        <p style="margin: 4px 0; font-size: 13px;"><strong>Booking Reference:</strong> #${booking._id.toString().slice(-8).toUpperCase()}</p>
                    </div>

                    <h3 style="color: #6b21a8; font-size: 18px; margin: 24px 0 12px 0; display: flex; align-items: center;">
                        <span>✨ Prescribed Remedies & Vedic Recommendations</span>
                    </h3>

                    ${remedies.gemstones ? `
                        <div style="margin-bottom: 14px; padding: 12px 16px; background: #faf5ff; border-left: 4px solid #a855f7; border-radius: 4px;">
                            <strong style="color: #7e22ce; display: block; font-size: 13px; text-transform: uppercase;">💎 Recommended Gemstone (రత్నాలు):</strong>
                            <p style="margin: 4px 0 0 0; color: #3b0764; font-size: 14px;">${escapeHtml(remedies.gemstones)}</p>
                        </div>
                    ` : ''}

                    ${remedies.poojas ? `
                        <div style="margin-bottom: 14px; padding: 12px 16px; background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px;">
                            <strong style="color: #b45309; display: block; font-size: 13px; text-transform: uppercase;">🪔 Recommended Poojas & Temple Visits (పూజలు / దర్శనాలు):</strong>
                            <p style="margin: 4px 0 0 0; color: #78350f; font-size: 14px;">${escapeHtml(remedies.poojas)}</p>
                        </div>
                    ` : ''}

                    ${remedies.mantras ? `
                        <div style="margin-bottom: 14px; padding: 12px 16px; background: #ecfdf5; border-left: 4px solid #10b981; border-radius: 4px;">
                            <strong style="color: #047857; display: block; font-size: 13px; text-transform: uppercase;">🕉️ Daily Mantras & Japa (మంత్ర సాధన):</strong>
                            <p style="margin: 4px 0 0 0; color: #064e3b; font-size: 14px;">${escapeHtml(remedies.mantras)}</p>
                        </div>
                    ` : ''}

                    ${remedies.generalNotes ? `
                        <div style="margin-bottom: 14px; padding: 12px 16px; background: #f0fdf4; border-left: 4px solid #0284c7; border-radius: 4px;">
                            <strong style="color: #0369a1; display: block; font-size: 13px; text-transform: uppercase;">📜 Astrologer Advice & General Notes:</strong>
                            <p style="margin: 4px 0 0 0; color: #0c4a6e; font-size: 14px; white-space: pre-line;">${escapeHtml(remedies.generalNotes)}</p>
                        </div>
                    ` : ''}

                    ${options.includeReviewLink !== false ? `
                        <div style="text-align: center; margin: 32px 0 16px 0; padding: 24px; background: #faf5ff; border: 1px dashed #d8b4fe; border-radius: 12px;">
                            <h4 style="margin: 0 0 8px 0; color: #581c87; font-size: 16px;">How was your consultation experience?</h4>
                            <p style="margin: 0 0 16px 0; font-size: 13px; color: #6b21a8;">Your honest feedback guides other seekers and helps us serve you better.</p>
                            <a href="${reviewUrl}" style="display: inline-block; background: linear-gradient(135deg, #9333ea, #4f46e5); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 14px; box-shadow: 0 4px 12px rgba(147, 51, 234, 0.35);">
                                ⭐ Write a Consultation Review
                            </a>
                        </div>
                    ` : ''}

                    <p style="margin-top: 28px; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px;">
                        May the divine cosmic planetary energies bring peace, prosperity, and clarity into your life.<br>
                        <strong>Acharya AstroSharma</strong> • Dedicated Vedic Consultations
                    </p>
                </div>
            </div>
        `;

        return await transporter.sendMail({
            from,
            to,
            subject,
            html
        });
    } catch (err) {
        console.error('Error sending consultation summary email:', err.message);
        return { error: err.message };
    }
};

module.exports = {
    escapeHtml,
    sendBookingConfirmationEmail,
    sendConsultationSummaryEmail,
};
