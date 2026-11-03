import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { CLIENT_URL } from './bookingFormat';

const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;
const MARGIN_MM = 10;
const FOOTER_MM = 8;
const BLOCK_GAP_MM = 3;
const CONTENT_WIDTH_MM = PAGE_WIDTH_MM - MARGIN_MM * 2;
const CONTENT_BOTTOM_MM = PAGE_HEIGHT_MM - MARGIN_MM - FOOTER_MM;
const REPORT_WIDTH_PX = Math.round((CONTENT_WIDTH_MM / 25.4) * 96);

const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const factRows = (facts) => facts
    .filter(([, value]) => value)
    .map(([label, value]) => `
        <tr>
            <td style="width:34%;padding:4px 8px 10px;border:1px solid #d6d3d1;background:#f9fafb;font-weight:700;">${escapeHtml(label)}</td>
            <td style="padding:4px 8px 10px;border:1px solid #d6d3d1;">${escapeHtml(value)}</td>
        </tr>`)
    .join('');

const block = (title, body) => `
    <section data-report-block style="background:#ffffff;padding-bottom:10px;">
        ${title ? `<div style="font-size:14px;font-weight:700;color:#581c87;padding-bottom:6px;margin-bottom:6px;border-bottom:2px solid #9333ea;">${escapeHtml(title)}</div>` : ''}
        ${body}
    </section>`;

const table = (rows) => `<table style="width:100%;border-collapse:collapse;font-size:12px;line-height:1.5;">${rows}</table>`;

const buildReportHtml = (booking, remedies) => {
    const paragraph = (label, text) => (text ? `
        <div style="margin-bottom:8px;padding:6px 10px 10px;border-left:4px solid #a855f7;background:#faf5ff;">
            <div style="font-size:11px;font-weight:700;color:#6b21a8;">${escapeHtml(label)}</div>
            <div style="font-size:12px;line-height:1.6;white-space:pre-line;">${escapeHtml(text)}</div>
        </div>` : '');

    const remedySections = [
        paragraph('Recommended Gemstones (రత్నాలు)', remedies.gemstones),
        paragraph('Recommended Poojas & Temples (పూజలు / దర్శనాలు)', remedies.poojas),
        paragraph('Prescribed Mantras & Daily Japa (మంత్ర సాధన)', remedies.mantras),
        paragraph('Acharya Remarks & Guidance (సాధారణ సూచనలు)', remedies.generalNotes),
    ].join('');

    const siteName = CLIENT_URL.replace(/^https?:\/\//, '');
    const reportDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    return [
        block('', `
            <div style="background:#581c87;color:#ffffff;text-align:center;padding:16px 12px 22px;border-radius:6px;">
                <div style="font-size:20px;font-weight:700;">ASTROSHARMA VEDIC ASTROLOGY</div>
                <div style="font-size:12px;color:#e9d5ff;margin-top:4px;">Vedic Horoscope Consultation & Sacred Remedies (పరిహారాలు)</div>
                <div style="font-size:11px;color:#e9d5ff;margin-top:2px;">${escapeHtml(siteName)} | Confidential Client Report</div>
            </div>
            <div style="display:flex;justify-content:space-between;background:#f3f4f6;font-size:11px;font-weight:700;color:#374151;padding:6px 10px 10px;margin-top:8px;">
                <span>Booking Ref: #${escapeHtml(String(booking._id ?? '').slice(-8).toUpperCase())}</span>
                <span>Date: ${escapeHtml(reportDate)}</span>
                <span>Status: ${escapeHtml(booking.status || 'Pending')}</span>
            </div>`),
        block('Client Profile', table(factRows([
            ['Client Name', booking.fullName],
            ['Consultation', booking.consultationType],
            ['Phone', booking.phone],
            ['Email', booking.email],
            ['Date of Birth', booking.dob],
            ['Time of Birth', booking.birthTime],
            ['Place of Birth', booking.birthPlace],
            ['Session Duration', booking.callDuration],
        ]))),
        remedySections
            ? block('Prescribed Vedic Remedies', remedySections)
            : block('Prescribed Vedic Remedies', '<div style="font-size:12px;padding-bottom:6px;">No remedies have been recorded for this consultation yet.</div>'),
        block('', `
            <div style="text-align:center;font-size:11px;color:#64748b;padding-top:8px;">
                <div style="font-style:italic;">"Sarve Bhavantu Sukhinah, Sarve Santu Niraamayaah"</div>
                <div style="margin-top:2px;">Prepared by Acharya AstroSharma</div>
            </div>`),
    ].join('');
};

// Telugu needs the browser to draw it: jsPDF's own text prints Telugu as gibberish.
// So the report is laid out as a page, captured as images, and placed on A4 pages whole.
export const generateConsultationPDF = async (booking, remedies = {}) => {
    const container = document.createElement('div');
    container.setAttribute('aria-hidden', 'true');
    container.style.cssText = `position:fixed;top:0;left:-10000px;width:${REPORT_WIDTH_PX}px;background:#ffffff;color:#111827;font-family:"Noto Sans Telugu","Inter",Arial,sans-serif;`;
    container.innerHTML = buildReportHtml(booking, remedies);
    document.body.appendChild(container);

    try {
        await document.fonts?.ready;

        const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
        let y = MARGIN_MM;

        for (const section of container.querySelectorAll('[data-report-block]')) {
            const canvas = await html2canvas(section, {
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false,
                ignoreElements: (element) => element.id === 'root',
            });
            const height = (canvas.height * CONTENT_WIDTH_MM) / canvas.width;
            const usableHeight = CONTENT_BOTTOM_MM - MARGIN_MM;
            const scale = Math.min(1, usableHeight / height);

            if (y + height * scale > CONTENT_BOTTOM_MM && y > MARGIN_MM) {
                pdf.addPage();
                y = MARGIN_MM;
            }
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', MARGIN_MM, y, CONTENT_WIDTH_MM * scale, height * scale, undefined, 'FAST');
            y += height * scale + BLOCK_GAP_MM;
        }

        const pageCount = pdf.getNumberOfPages();
        for (let page = 1; page <= pageCount; page++) {
            pdf.setPage(page);
            pdf.setFontSize(8);
            pdf.setTextColor(100);
            pdf.text(`Page ${page} of ${pageCount}`, PAGE_WIDTH_MM - MARGIN_MM, PAGE_HEIGHT_MM - MARGIN_MM, { align: 'right' });
        }

        const safeName = (booking.fullName || 'Client').trim().replace(/[^\p{L}\p{M}\p{N}]+/gu, '_');
        const filename = `AstroSharma_Consultation_Report_${safeName}.pdf`;
        pdf.save(filename);
        return filename;
    } finally {
        container.remove();
    }
};
