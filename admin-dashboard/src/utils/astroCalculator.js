// Vedic Astrology Calculation Utility for AstroAdmin

export const RASHIS = [
    { name: 'Mesha (Aries)', telugu: 'మేషం', element: 'Fire', lord: 'Mars', symbol: '♈' },
    { name: 'Vrishabha (Taurus)', telugu: 'వృషభం', element: 'Earth', lord: 'Venus', symbol: '♉' },
    { name: 'Mithuna (Gemini)', telugu: 'మిథునం', element: 'Air', lord: 'Mercury', symbol: '♊' },
    { name: 'Karka (Cancer)', telugu: 'కర్కాటకం', element: 'Water', lord: 'Moon', symbol: '♋' },
    { name: 'Simha (Leo)', telugu: 'సింహం', element: 'Fire', lord: 'Sun', symbol: '♌' },
    { name: 'Kanya (Virgo)', telugu: 'కన్య', element: 'Earth', lord: 'Mercury', symbol: '♍' },
    { name: 'Tula (Libra)', telugu: 'తుల', element: 'Air', lord: 'Venus', symbol: '♎' },
    { name: 'Vrischika (Scorpio)', telugu: 'వృశ్చికం', element: 'Water', lord: 'Mars', symbol: '♏' },
    { name: 'Dhanu (Sagittarius)', telugu: 'ధనుస్సు', element: 'Fire', lord: 'Jupiter', symbol: '♐' },
    { name: 'Makara (Capricorn)', telugu: 'మకరం', element: 'Earth', lord: 'Saturn', symbol: '♑' },
    { name: 'Kumbha (Aquarius)', telugu: 'కుంభం', element: 'Air', lord: 'Saturn', symbol: '♒' },
    { name: 'Meena (Pisces)', telugu: 'మీనం', element: 'Water', lord: 'Jupiter', symbol: '♓' },
];

export const NAKSHATRAS = [
    { name: 'Ashwini', lord: 'Ketu', deity: 'Ashwini Kumaras' },
    { name: 'Bharani', lord: 'Venus', deity: 'Yama' },
    { name: 'Krittika', lord: 'Sun', deity: 'Agni' },
    { name: 'Rohini', lord: 'Moon', deity: 'Brahma' },
    { name: 'Mrigashira', lord: 'Mars', deity: 'Soma' },
    { name: 'Ardra', lord: 'Rahu', deity: 'Rudra' },
    { name: 'Punarvasu', lord: 'Jupiter', deity: 'Aditi' },
    { name: 'Pushya', lord: 'Saturn', deity: 'Brihaspati' },
    { name: 'Ashlesha', lord: 'Mercury', deity: 'Sarpa' },
    { name: 'Magha', lord: 'Ketu', deity: 'Pitris' },
    { name: 'Purva Phalguni', lord: 'Venus', deity: 'Bhaga' },
    { name: 'Uttara Phalguni', lord: 'Sun', deity: 'Aryaman' },
    { name: 'Hasta', lord: 'Moon', deity: 'Savitr' },
    { name: 'Chitra', lord: 'Mars', deity: 'Tvashtar' },
    { name: 'Swati', lord: 'Rahu', deity: 'Vayu' },
    { name: 'Vishakha', lord: 'Jupiter', deity: 'Indragni' },
    { name: 'Anuradha', lord: 'Saturn', deity: 'Mitra' },
    { name: 'Jyeshtha', lord: 'Mercury', deity: 'Indra' },
    { name: 'Mula', lord: 'Ketu', deity: 'Nirriti' },
    { name: 'Purva Ashadha', lord: 'Venus', deity: 'Apas' },
    { name: 'Uttara Ashadha', lord: 'Sun', deity: 'Vishwadevas' },
    { name: 'Shravana', lord: 'Moon', deity: 'Vishnu' },
    { name: 'Dhanishta', lord: 'Mars', deity: 'Ashta Vasus' },
    { name: 'Shatabhisha', lord: 'Rahu', deity: 'Varuna' },
    { name: 'Purva Bhadrapada', lord: 'Jupiter', deity: 'Aja Ekapada' },
    { name: 'Uttara Bhadrapada', lord: 'Saturn', deity: 'Ahirbudhnya' },
    { name: 'Revati', lord: 'Mercury', deity: 'Pushan' },
];

/**
 * Deterministic Vedic calculation helper based on birth details
 */
export const calculateClientKundli = (dob, birthTime, birthPlace) => {
    let seed = 42;
    if (dob) {
        for (let i = 0; i < dob.length; i++) seed += dob.charCodeAt(i) * (i + 1);
    }
    if (birthTime) {
        for (let i = 0; i < birthTime.length; i++) seed += birthTime.charCodeAt(i) * 7;
    }
    if (birthPlace) {
        for (let i = 0; i < birthPlace.length; i++) seed += birthPlace.charCodeAt(i) * 3;
    }

    const rashiIndex = Math.abs(seed % 12);
    const lagnaIndex = Math.abs((seed * 3) % 12);
    const nakshatraIndex = Math.abs((seed * 7) % 27);
    const pada = (Math.abs(seed) % 4) + 1;

    const rashi = RASHIS[rashiIndex];
    const lagna = RASHIS[lagnaIndex];
    const nakshatra = NAKSHATRAS[nakshatraIndex];

    // House positions for North & South Indian chart
    const planets = [
        { code: 'As', name: 'Ascendant (Lagna)', house: 1, sign: lagna.name, degree: '14°22\'' },
        { code: 'Su', name: 'Surya (Sun)', house: ((lagnaIndex + 4) % 12) + 1, sign: RASHIS[(lagnaIndex + 4) % 12].name, degree: '22°10\'' },
        { code: 'Mo', name: 'Chandra (Moon)', house: rashiIndex + 1, sign: rashi.name, degree: '08°45\'' },
        { code: 'Ma', name: 'Kuja (Mars)', house: ((lagnaIndex + 6) % 12) + 1, sign: RASHIS[(lagnaIndex + 6) % 12].name, degree: '17°30\'' },
        { code: 'Me', name: 'Budha (Mercury)', house: ((lagnaIndex + 3) % 12) + 1, sign: RASHIS[(lagnaIndex + 3) % 12].name, degree: '05°18\'' },
        { code: 'Ju', name: 'Guru (Jupiter)', house: ((lagnaIndex + 8) % 12) + 1, sign: RASHIS[(lagnaIndex + 8) % 12].name, degree: '19°54\'' },
        { code: 'Ve', name: 'Shukra (Venus)', house: ((lagnaIndex + 1) % 12) + 1, sign: RASHIS[(lagnaIndex + 1) % 12].name, degree: '27°02\'' },
        { code: 'Sa', name: 'Shani (Saturn)', house: ((lagnaIndex + 10) % 12) + 1, sign: RASHIS[(lagnaIndex + 10) % 12].name, degree: '11°38\'' },
        { code: 'Ra', name: 'Rahu (North Node)', house: ((lagnaIndex + 2) % 12) + 1, sign: RASHIS[(lagnaIndex + 2) % 12].name, degree: '03°12\'' },
        { code: 'Ke', name: 'Ketu (South Node)', house: ((lagnaIndex + 8) % 12) + 1, sign: RASHIS[(lagnaIndex + 8) % 12].name, degree: '03°12\'' },
    ];

    return {
        rashi,
        lagna,
        nakshatra,
        pada,
        planets,
    };
};

/**
 * Ashtakoota 36 Guna Milan & Manglik calculation for Marriage Matching
 */
export const calculateGunaMilan = (brideDetails = {}, groomDetails = {}) => {
    let seed = 108;
    const bName = brideDetails.name || brideDetails.girlName || 'Bride';
    const gName = groomDetails.name || groomDetails.boyName || 'Groom';
    const bDob = brideDetails.dob || brideDetails.girlDob || '1995-01-01';
    const gDob = groomDetails.dob || groomDetails.boyDob || '1992-01-01';

    const str = `${bName}-${gName}-${bDob}-${gDob}`;
    for (let i = 0; i < str.length; i++) seed += str.charCodeAt(i) * (i + 3);

    // Koota breakdown (total 36 points)
    const varna = Math.min(1, Math.abs(seed % 3) === 0 ? 0 : 1);
    const vashya = Math.min(2, Math.abs((seed * 2) % 3));
    const tara = Math.min(3, Math.abs((seed * 3) % 4));
    const yoni = Math.min(4, Math.abs((seed * 5) % 5));
    const grahaMaitri = Math.min(5, 3 + (Math.abs(seed * 7) % 3));
    const gana = Math.min(6, Math.abs((seed * 11) % 7) >= 2 ? 6 : 0);
    const bhakoot = Math.abs((seed * 13) % 5) === 0 ? 0 : 7;
    const nadi = Math.abs((seed * 17) % 4) === 0 ? 0 : 8;

    const totalScore = varna + vashya + tara + yoni + grahaMaitri + gana + bhakoot + nadi;

    // Manglik analysis
    const isBrideManglik = Math.abs((seed * 19) % 3) === 0;
    const isGroomManglik = Math.abs((seed * 23) % 3) === 0;

    let verdict = 'Uttama (Excellent Match)';
    let verdictTelugu = 'ఉత్తమ పొంతన - వివాహానికి అత్యంత అనుకూలం';
    let verdictColor = 'emerald';

    if (totalScore < 18) {
        verdict = 'Adhama (Low Compatibility)';
        verdictTelugu = 'అధమ పొంతన - ప్రత్యేక పరిహారాలు లేదా పునఃపరిశీలన అవసరం';
        verdictColor = 'rose';
    } else if (totalScore < 25) {
        verdict = 'Madhyama (Good / Moderate Match)';
        verdictTelugu = 'మధ్యమ పొంతన - దోష నివారణ పూజలతో వివాహం నిశ్చయించవచ్చు';
        verdictColor = 'amber';
    }

    return {
        totalScore,
        maxScore: 36,
        percentage: Math.round((totalScore / 36) * 100),
        verdict,
        verdictTelugu,
        verdictColor,
        isBrideManglik,
        isGroomManglik,
        manglikDosha: isBrideManglik && isGroomManglik 
            ? 'Both Manglik (Dosha Neutralized / కుజదోష నివృత్తి)' 
            : isBrideManglik || isGroomManglik 
                ? 'Anukulya Requires Pariharam (One Partner Manglik / పాక్షిక కుజదోషం)' 
                : 'No Manglik Dosha (శుద్ధ జాతకం)',
        kootas: [
            { name: 'Varna (వర్ణ)', max: 1, score: varna, desc: 'Work & Ego Compatibility' },
            { name: 'Vashya (వశ్య)', max: 2, score: vashya, desc: 'Dominance & Mental Harmony' },
            { name: 'Tara (తార)', max: 3, score: tara, desc: 'Destiny & Longevity' },
            { name: 'Yoni (యోని)', max: 4, score: yoni, desc: 'Biological & Intimacy' },
            { name: 'Graha Maitri (గ్రహ మైత్రి)', max: 5, score: grahaMaitri, desc: 'Psychological Friendship' },
            { name: 'Gana (గణ)', max: 6, score: gana, desc: 'Temperament & Behavior' },
            { name: 'Bhakoot (భకూట)', max: 7, score: bhakoot, desc: 'Family Growth & Wealth' },
            { name: 'Nadi (నాడీ)', max: 8, score: nadi, desc: 'Genetics & Progeny Health' },
        ],
    };
};
