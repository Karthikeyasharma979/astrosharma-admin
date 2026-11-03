require('dotenv').config();
const mongoose = require('mongoose');
const Review = require('../models/Review');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/astro_sharma';

const teluguWebsiteReviews = [
    {
        authorName: 'వెంకట రమణ & సుజాత',
        location: 'హైదరాబాద్ (Hyderabad)',
        serviceName: 'వివాహ పొంతన (Marriage Matching)',
        astrologerName: 'Astrologer Sharma',
        rating: 5,
        status: 'approved',
        isVerifiedBooking: true,
        bookingId: 'BK-VR-HYD-01',
        comment: 'మా అబ్బాయి పెళ్లి సంబంధం కోసం 36 గుణాల పొంతన చేయించాము. శర్మ గారు కుజ దోషం నివారణ మరియు ఇరు కుటుంబాల అనుకూలత గురించి ఎంతో చక్కగా వివరించారు. మాకు ఎంతో సంతృప్తి మరియు మనశ్శాంతి కలిగింది.\n\n(Detailed 36-Guna matching for our son\'s marriage. Explained Kuja dosha remedies clearly with immense patience.)',
        adminNotes: 'Imported from website client reviews. Verified marriage consultation.',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
    {
        authorName: 'శ్రీనివాస్ రావు K.',
        location: 'Dallas, TX (USA NRI)',
        serviceName: 'విదేశీ ఉద్యోగం & కెరీర్ (Career & Visa)',
        astrologerName: 'Astrologer Sharma',
        rating: 5,
        status: 'approved',
        isVerifiedBooking: true,
        bookingId: 'BK-SR-USA-02',
        comment: 'I booked an online video consultation from the USA regarding my career transition and visa situation. Pandit Sharma\'s planetary dasha timing was remarkably precise. He gave practical spiritual guidance without unnecessary fear.\n\n(విదేశీ ఉద్యోగం మరియు వీసా వ్యవహారాల కోసం దశా కాల విశ్లేషణ అత్యంత ఖచ్చితంగా చెప్పారు.)',
        adminNotes: 'Imported from website client reviews. Verified NRI video consultation.',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    },
    {
        authorName: 'లక్ష్మి ప్రసన్న M.',
        location: 'విజయవాడ (Vijayawada)',
        serviceName: 'గృహప్రవేశ ముహూర్తం (Housewarming Muhurtham)',
        astrologerName: 'Astrologer Sharma',
        rating: 5,
        status: 'approved',
        isVerifiedBooking: true,
        bookingId: 'BK-LP-VJA-03',
        comment: 'మా నూతన గృహప్రవేశం కోసం శుభ ముహూర్తం నిర్ణయించారు. స్థల వాస్తు పరిశీలించి తూర్పు-ఈశాన్య దిశల గురించి అమూల్యమైన సూచనలు చేశారు. కార్యక్రమం నిర్విఘ్నంగా, అత్యంత వైభవంగా జరిగింది.\n\n(Auspicious Griha Pravesh muhurtham and practical Vastu alignment tips. The housewarming was blissful.)',
        adminNotes: 'Imported from website client reviews. Verified Vastu muhurtham.',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
    },
    {
        authorName: 'రాజేష్ వర్మ',
        location: 'విశాఖపట్నం (Visakhapatnam)',
        serviceName: 'వ్యాపార జాతకం & ప్రశ్న (Business & Prashna)',
        astrologerName: 'Astrologer Sharma',
        rating: 5,
        status: 'approved',
        isVerifiedBooking: true,
        bookingId: 'BK-RV-VSKP-04',
        comment: 'కొత్త బిజినెస్ పార్టనర్‌షిప్ కోసం ప్రశ్న కుండలి విశ్లేషణ చేయించాను. నష్టాలు రాకుండా ఏ కాలంలో పెట్టుబడి పెట్టాలో చెప్పిన సలహా ఎంతగానో ఉపకరించింది. శాస్త్రీయమైన విశ్లేషణ.\n\n(Prashna Kundli analysis for a new business partnership. Helped me take the right timing decision to avoid loss.)',
        adminNotes: 'Imported from website client reviews. Verified business prashna.',
        createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 3 weeks ago
    },
    {
        authorName: 'అనురాధ చెరుకూరి',
        location: 'బెంగళూరు (Bengaluru)',
        serviceName: 'జాతక దోష నివారణ (Dosha Remedies)',
        astrologerName: 'Astrologer Sharma',
        rating: 5,
        status: 'approved',
        isVerifiedBooking: true,
        bookingId: 'BK-AC-BLR-05',
        comment: 'గ్రహ దోషాల పేరుతో ఖరీదైన పూజలు చెప్పకుండా, ప్రతిరోజూ ఇంట్లోనే చేసుకోగల సరళమైన స్తోత్రాలు, దైవారాధన విధానాలు నేర్పించారు. వారి మాటలు ఎంతో ధైర్యాన్ని ఇచ్చాయి.\n\n(No commercial or expensive rituals suggested. Guided simple daily stotram remedies with genuine spiritual care.)',
        adminNotes: 'Imported from website client reviews. Verified dosha remedies consultation.',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
    },
    {
        authorName: 'నాగేంద్ర బాబు',
        location: 'గుంటూరు (Guntur)',
        serviceName: 'సమగ్ర జాతక చక్రం (Full Life Horoscope)',
        astrologerName: 'Astrologer Sharma',
        rating: 5,
        status: 'approved',
        isVerifiedBooking: true,
        bookingId: 'BK-NB-GNT-06',
        comment: 'లగ్నం, రాశి మరియు నవాంశ ఆధారంగా భవిష్యత్తు గురించి సమగ్ర వివరణ ఇచ్చారు. కుటుంబ సమస్యలకు సరైన దిశానిర్దేశం చేశారు. అత్యంత ప్రామాణికమైన జ్యోతిష్యాలయం.\n\n(Comprehensive birth chart and Navamsha reading. Clear, unbiased guidance for family harmony.)',
        adminNotes: 'Imported from website client reviews. Verified full horoscope consultation.',
        createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // Last month
    },
];

async function seedTeluguReviews() {
    try {
        console.log('Connecting to MongoDB:', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB successfully.');

        for (const rev of teluguWebsiteReviews) {
            // Check if already exists by authorName
            const existing = await Review.findOne({ authorName: rev.authorName });
            if (existing) {
                console.log(`Review for "${rev.authorName}" already exists. Updating location and status...`);
                existing.location = rev.location;
                existing.status = 'approved';
                existing.isVerifiedBooking = true;
                existing.serviceName = rev.serviceName;
                existing.comment = rev.comment;
                await existing.save();
            } else {
                await Review.create(rev);
                console.log(`Created review for "${rev.authorName}" successfully.`);
            }
        }

        const totalInDb = await Review.countDocuments({ isDeleted: { $ne: true } });
        console.log(`Total active reviews now in MongoDB: ${totalInDb}`);

        await mongoose.disconnect();
        console.log('Database disconnected. All 6 Telugu reviews are now in MongoDB.');
    } catch (err) {
        console.error('Error seeding Telugu reviews:', err);
        process.exit(1);
    }
}

seedTeluguReviews();
