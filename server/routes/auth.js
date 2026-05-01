const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const VerifiedTeacher = require('../models/VerifiedTeacher');

// Register
router.post('/register', async (req, res) => {
    console.log('=== REGISTER START ===');
    console.log('Body:', JSON.stringify(req.body));
    try {
        const { email, password, role, name } = req.body;
        console.log('[REG 1] Parsed:', { email, role, name: name || '(empty)' });

        // Check if user exists
        let user = await User.findOne({ email });
        console.log('[REG 2] User lookup done, exists:', !!user);
        if (user) return res.status(400).json({ msg: 'User already exists' });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        console.log('[REG 3] Password hashed');

        // Enforce verified email for teachers
        if (role === 'teacher') {
            const verified = await VerifiedTeacher.findOne({ email: new RegExp(`^${email}$`, 'i') });
            if (!verified) {
                return res.status(403).json({ msg: 'Email not found in verified faculty directory. Please ask Admin to sync.' });
            }
        }

        // Determine Name if not provided
        const userRole = role || 'student';
        let finalName = name;
        if (!finalName) {
            if (userRole === 'admin') finalName = 'Admin';
            else if (userRole === 'student') finalName = 'Student';
            else return res.status(400).json({ msg: 'Name is required for Teachers' });
        }
        console.log('[REG 4] finalName:', finalName, 'userRole:', userRole);

        user = new User({
            name: finalName,
            email,
            passwordHash,
            role: userRole
        });
        console.log('[REG 5] User object created');

        await user.save();
        console.log('[REG 6] User saved to DB');

        // Create token
        const payload = { user: { id: user.id, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' }, (err, token) => {
            if (err) {
                console.error('[REG 7] JWT error:', err);
                return res.status(500).json({ msg: 'JWT error', error: err.message });
            }
            console.log('[REG 8] Token generated. SUCCESS.');
            res.json({ token });
        });
    } catch (err) {
        console.error('=== REGISTER ERROR ===');
        console.error('Message:', err.message);
        console.error('Stack:', err.stack);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    console.log('=== LOGIN START ===');
    console.log('Body:', JSON.stringify(req.body));
    try {
        const { email, password } = req.body;
        console.log('[LOGIN 1] Email:', email);

        // Check user
        const user = await User.findOne({ email });
        console.log('[LOGIN 2] User found:', !!user);
        if (!user) {
            console.log('[LOGIN 2b] User NOT found, returning 400');
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }
        console.log('[LOGIN 3] User details:', { id: user._id, email: user.email, role: user.role, name: user.name });

        // Validate password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        console.log('[LOGIN 4] Password match:', isMatch);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Return token
        const payload = { user: { id: user.id, role: user.role } };
        console.log('[LOGIN 5] Signing JWT...');
        jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' }, (err, token) => {
            if (err) {
                console.error('[LOGIN 6] JWT error:', err);
                return res.status(500).json({ msg: 'JWT error', error: err.message });
            }
            console.log('[LOGIN 7] SUCCESS! Sending response.');
            res.json({ token, role: user.role, userId: user.id, name: user.name });
        });
    } catch (err) {
        console.error('=== LOGIN ERROR ===');
        console.error('Message:', err.message);
        console.error('Stack:', err.stack);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});


// Sync Teachers from Website
router.post('/sync-teachers', async (req, res) => {
    console.log('=== SYNC TEACHERS START ===');
    try {
        // Fetch IIITM teachers page
        const response = await fetch('https://www.iiitm.ac.in/index.php/en/component/splms/?view=teachers');
        const text = await response.text();
        
        // Regex to extract all emails ending with @iiitm.ac.in
        const matches = [...text.matchAll(/([a-zA-Z0-9._-]+@iiitm\.ac\.in)/g)];
        const uniqueEmails = [...new Set(matches.map(m => m[1].toLowerCase().trim()))];
        console.log(`[SYNC 1] Found ${uniqueEmails.length} unique emails on website`);

        // We will just clear and recreate the VerifiedTeacher collection for simplicity
        // as we don't have secondary data to preserve in this model
        await VerifiedTeacher.deleteMany({});
        
        const docsToInsert = uniqueEmails.map(email => ({ email }));
        if (docsToInsert.length > 0) {
            await VerifiedTeacher.insertMany(docsToInsert);
        }

        console.log(`[SYNC 2] Added/Updated: ${uniqueEmails.length} verified emails`);
        res.json({ msg: 'Sync successful', added: uniqueEmails.length, deleted: 0, totalActive: uniqueEmails.length });

    } catch (err) {
        console.error('=== SYNC TEACHERS ERROR ===');
        console.error(err);
        res.status(500).json({ msg: 'Failed to sync teachers', error: err.message });
    }
});

// Clerk Login Bridge
router.post('/clerk-login', async (req, res) => {
    console.log('=== CLERK LOGIN START ===');
    try {
        const { email, name, intendedRole } = req.body;
        if (!email) {
            return res.status(400).json({ msg: 'Email is required' });
        }

        const role = intendedRole || 'student';

        // Enforce college domain for ALL roles
        if (!email.toLowerCase().endsWith('@iiitm.ac.in')) {
            console.log(`[CLERK LOGIN] Rejected non-college email: ${email}`);
            return res.status(403).json({ msg: 'Please login with your verified college email (@iiitm.ac.in).' });
        }

        // Enforce verified email for teachers
        if (role === 'teacher') {
            const verified = await VerifiedTeacher.findOne({ email: new RegExp(`^${email}$`, 'i') });
            if (!verified) {
                console.log(`[CLERK LOGIN] Rejected unverified teacher attempt: ${email}`);
                return res.status(403).json({ msg: 'Email not found in verified faculty directory. Please contact Admin.' });
            }
        }

        // Find user by email
        let user = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
        
        if (!user) {
            console.log(`[CLERK LOGIN] User not found, auto-registering as ${role}:`, email);
            const salt = await bcrypt.genSalt(10);
            const dummyPasswordHash = await bcrypt.hash('CLERK_AUTH_' + Date.now(), salt);
            
            // Format name nicely
            let displayName = name || email.split('@')[0];
            if (role === 'teacher' && !displayName.toLowerCase().startsWith('dr') && !displayName.toLowerCase().startsWith('prof')) {
                // Keep the name from Google, it's usually correct
            }
            
            user = new User({
                name: displayName,
                email: email.toLowerCase(),
                passwordHash: dummyPasswordHash,
                role: role
            });
            await user.save();
        } else if (role === 'teacher' && user.role !== 'teacher') {
            // They are registered as a student (maybe from previous usage) but they are actually a verified teacher
            // Since they passed the VerifiedTeacher check above, we should promote them!
            console.log(`[CLERK LOGIN] Promoting existing user ${email} to teacher!`);
            user.role = 'teacher';
            await user.save();
        }

        console.log('[CLERK LOGIN] User verified:', { email: user.email, role: user.role });

        // Issue standard JWT to maintain compatibility with backend routes
        const payload = { user: { id: user.id, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' }, (err, token) => {
            if (err) {
                console.error('[CLERK LOGIN] JWT error:', err);
                return res.status(500).json({ msg: 'JWT error', error: err.message });
            }
            console.log('[CLERK LOGIN] SUCCESS! Sending legacy JWT.');
            res.json({ token, role: user.role, userId: user.id, name: user.name });
        });

    } catch (err) {
        console.error('=== CLERK LOGIN ERROR ===');
        console.error(err);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

module.exports = router;
