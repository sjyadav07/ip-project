const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();

// Processing Layer before Main Logic (Middleware)
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Connection with MongoDB
mongoose.connect("mongodb+srv://sjyadav2004:Sachin%402004@contact-db.nwimfs4.mongodb.net/?retryWrites=true&w=majority&appName=contact-db", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log('❌ MongoDB Error:', err));

// This defines how a Contact will be stored in MongoDB.
const ContactSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    phone: String,
    createdAt: { type: Date, default: Date.now }
});

const Contact = mongoose.model('Contact', ContactSchema);

// Fetch all contacts and sort it in A-Z or Z-A or recent addition according to request
app.get('/api/contacts', async (req, res) => {
    let { sort } = req.query;
    let sortOption = {};

    if (sort === "nameAsc") sortOption = { name: 1 };
    if (sort === "nameDesc") sortOption = { name: -1 };
    if (sort === "recent") sortOption = { createdAt: -1 };

    const contacts = await Contact.find().sort(sortOption);
    res.json(contacts);
});

// Add a new contact to MongoDB and also checks for duplicate email before saving
app.post('/api/contacts', async (req, res) => {
    const { name, email, phone } = req.body;

    // Check if the email format is valid (for ex:- name@email.com)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: "Invalid email" });

    // Check if email is duplicate or not
    const exists = await Contact.findOne({ email });
    if (exists) return res.status(400).json({ error: "Email already exists!" });

    const newContact = new Contact({ name, email, phone });
    await newContact.save();
    res.json({ message: 'Contact Added', contact: newContact });
});

// Update or edit an existing contact in the database using its ID
app.put('/api/contacts/:id', async (req, res) => {
    const { name, email, phone } = req.body;
    const updated = await Contact.findByIdAndUpdate(req.params.id, { name, email, phone }, { new: true });
    res.json({ message: '✏️ Contact Updated', contact: updated });
});

// Find and delete a contact from the database
app.delete('/api/contacts/:id', async (req, res) => {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ message: 'Contact Deleted' });
});

// Server start message on this port
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
