require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

async function checkDB() {
    try {
        const client = await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB:", client.connection.name);
        
        const collections = await client.connection.db.listCollections().toArray();
        console.log("Collections:", collections.map(c => c.name));

        const bookingsCollection = client.connection.db.collection('bookings');
        const count = await bookingsCollection.countDocuments();
        console.log("Bookings count:", count);

        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
checkDB();
