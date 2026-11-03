// The main site saves bookings under the service name in the customer's language
const TELUGU_SERVICE_NAMES = {
    'జాతక విశ్లేషణ': 'Horoscope Report',
    'ప్రశ్న కుండలి': 'Prashna Kundali',
    'వివాహ పొంతన': 'Marriage Matching',
    'ఇతర ముహూర్తాలకు': 'Other Muhurthams',
    'వివాహ ముహూర్త నిర్ణయం': 'Marriage Muhurtham',
};

export const normalizeServiceName = (name) => TELUGU_SERVICE_NAMES[name] || name || '';

const parseRupees = (value) => {
    const parsed = parseFloat(String(value ?? '').replace(/[^0-9.]/g, ''));
    return Number.isNaN(parsed) ? null : parsed;
};

// `price` is the list price as text like "₹701". What the customer paid is `finalPrice`;
// bookings from before discounts existed only have the list price. Null means it isn't known.
export const getListPrice = (booking) => (
    typeof booking.originalPrice === 'number' ? booking.originalPrice : parseRupees(booking.price)
);

export const getAmountPaid = (booking) => (
    typeof booking.finalPrice === 'number' ? booking.finalPrice : parseRupees(booking.price)
);

export const hasDiscount = (booking) => {
    const listPrice = getListPrice(booking);
    const paid = getAmountPaid(booking);
    return listPrice !== null && paid !== null && paid < listPrice;
};

// Marriage bookings have the couple's names and may have no fullName
export const getClientName = (booking) => booking.fullName
    || (booking.girlName && booking.boyName ? `${booking.girlName} & ${booking.boyName}` : '')
    || booking.girlName
    || booking.boyName
    || 'Anonymous Client';

export const formatAmount =(amount) => (amount === null ? '—' : amount.toLocaleString('en-IN'));

// The customer website, used for review links
export const CLIENT_URL = (import.meta.env.VITE_CLIENT_URL || 'https://astrosharma.me').replace(/\/$/, '');
