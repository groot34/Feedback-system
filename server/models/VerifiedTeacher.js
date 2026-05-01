const mongoose = require('mongoose');

const VerifiedTeacherSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String }
});

module.exports = mongoose.model('VerifiedTeacher', VerifiedTeacherSchema);
