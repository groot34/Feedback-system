const express = require('express');
const router = express.Router();
const FeedbackForm = require('../models/FeedbackForm');
const FeedbackResponse = require('../models/FeedbackResponse');
const User = require('../models/User');

const { auth, isAdmin, isTeacher } = require('../middleware/auth');

// Create a new feedback form
router.post('/create', isAdmin, async (req, res) => {
    try {
        const { title, description, questions, assignedFaculty, hasLabComponent, startDate, endDate, allowedEmails } = req.body;
        const form = new FeedbackForm({
            title,
            description,
            questions,
            assignedFaculty,
            hasLabComponent: hasLabComponent || false,
            startDate,
            endDate,
            allowedEmails: allowedEmails || []
        });
        await form.save();
        res.json(form);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get all active forms (for students) with populated faculty info
// Now supports filtering by student email if studentId is provided in query
router.get('/all', auth, async (req, res) => {
    try {
        const { studentId } = req.query;
        let query = { active: true };

        // If a student is requesting forms, check if they are explicitly allowed
        if (studentId) {
            const student = await User.findById(studentId);
            if (student) {
                const studentEmail = student.email;
                query = {
                    ...query,
                    $or: [
                        { allowedEmails: { $exists: false } }, // Field doesn't exist (old forms)
                        { allowedEmails: { $size: 0 } },       // Field is empty array (public forms)
                        { allowedEmails: studentEmail }       // Student is in the allowlist
                    ]
                };
            }
        }

        const forms = await FeedbackForm.find(query)
            .populate('assignedFaculty', 'name email')
            .sort({ createdAt: -1 });
        res.json(forms);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Delete a feedback form and its associated responses
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const formId = req.params.id;
        
        // Remove the form
        const deletedForm = await FeedbackForm.findByIdAndDelete(formId);
        if (!deletedForm) {
            return res.status(404).json({ msg: 'Form not found' });
        }

        // Remove all responses associated with this form
        await FeedbackResponse.deleteMany({ formId });

        res.json({ msg: 'Form and associated responses deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get list of all faculty members
router.get('/faculty-list', auth, async (req, res) => {
    try {
        const faculty = await User.find({ role: 'teacher' }).select('name email');
        res.json(faculty);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Close a feedback form instantly
router.patch('/close/:id', isAdmin, async (req, res) => {
    try {
        const formId = req.params.id;
        const updatedForm = await FeedbackForm.findByIdAndUpdate(
            formId,
            { endDate: new Date() },
            { new: true }
        );

        if (!updatedForm) {
            return res.status(404).json({ msg: 'Form not found' });
        }

        res.json(updatedForm);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Submit feedback
router.post('/submit', auth, async (req, res) => {
    try {
        const { formId, answers, studentId } = req.body;

        if (studentId) {
            const existingResponse = await FeedbackResponse.findOne({ formId, studentId });
            if (existingResponse) {
                return res.status(400).json({ msg: 'You have already submitted feedback for this form' });
            }
        }

        const response = new FeedbackResponse({
            formId,
            answers,
            studentId
        });

        await response.save();
        res.json({ msg: 'Feedback submitted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get all feedback responses (for admin)
router.get('/responses', isAdmin, async (req, res) => {
    try {
        const responses = await FeedbackResponse.find()
            .populate({ 
                path: 'formId', 
                select: 'title assignedFaculty',
                populate: { path: 'assignedFaculty', select: 'name' }
            })
            .sort({ submittedAt: -1 });
        res.json(responses);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get form IDs that a student has already submitted feedback for
router.get('/submitted/:studentId', auth, async (req, res) => {
    try {
        const { studentId } = req.params;
        const responses = await FeedbackResponse.find({ studentId }).select('formId');
        const submittedFormIds = responses.map(r => r.formId.toString());
        res.json({ submittedFormIds });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Toggle approval for a single response
router.patch('/approve/:responseId', isAdmin, async (req, res) => {
    try {
        const response = await FeedbackResponse.findById(req.params.responseId);
        if (!response) return res.status(404).json({ msg: 'Response not found' });

        response.approvedForTeacher = !response.approvedForTeacher;
        await response.save();
        res.json({ approved: response.approvedForTeacher });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Approve or revoke all responses for a given form
router.patch('/approve-all/:formId', isAdmin, async (req, res) => {
    try {
        const { approve } = req.body;
        const result = await FeedbackResponse.updateMany(
            { formId: req.params.formId },
            { $set: { approvedForTeacher: approve } }
        );
        res.json({ modified: result.modifiedCount, approved: approve });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get only approved responses for a specific teacher
router.get('/responses/teacher/:teacherId', isTeacher, async (req, res) => {
    try {
        const responses = await FeedbackResponse.find({ approvedForTeacher: true })
            .populate({ path: 'formId', select: 'title assignedFaculty' })
            .sort({ submittedAt: -1 });

        const filtered = responses.filter(r => r.formId && r.formId.assignedFaculty?.toString() === req.params.teacherId);
        res.json(filtered);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
