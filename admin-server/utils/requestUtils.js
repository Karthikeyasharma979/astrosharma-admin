const mongoose = require('mongoose');

const isValidObjectId = (value) => typeof value === 'string' && mongoose.isObjectIdOrHexString(value);

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Keeps text fields as text, so a request can't slip database operators into a query
const asText = (value, maxLength = 2000) => (typeof value === 'string' ? value.trim().slice(0, maxLength) : '');

// The main site saves bookings under the service name in the customer's language
const TELUGU_SERVICE_NAMES = {
    'జాతక విశ్లేషణ': 'Horoscope Report',
    'ప్రశ్న కుండలి': 'Prashna Kundali',
    'వివాహ పొంతన': 'Marriage Matching',
    'ఇతర ముహూర్తాలకు': 'Other Muhurthams',
    'వివాహ ముహూర్త నిర్ణయం': 'Marriage Muhurtham'
};

const normalizeServiceName = (name) => TELUGU_SERVICE_NAMES[name] || name;

// The amount actually paid. Older bookings only have the list price saved as text like "₹701".
const getAmountPaid = (booking) => {
    if (typeof booking.finalPrice === 'number') return booking.finalPrice;
    const parsed = parseFloat(String(booking.price || '').replace(/[^0-9.]/g, ''));
    return Number.isNaN(parsed) ? 0 : parsed;
};

const getContactName = (contact) => contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(' ');

module.exports = { isValidObjectId, escapeRegex, asText, normalizeServiceName, getAmountPaid, getContactName };
