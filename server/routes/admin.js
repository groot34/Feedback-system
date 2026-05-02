const express = require('express');
const router = express.Router();
const User = require('../models/User');

const { isAdmin } = require('../middleware/auth');

// Add Student Identity Commitment
router.post('/add-student-identity', isAdmin, async (req, res) => {
    try {
        const { userId, identityCommitment } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        user.identityCommitment = identityCommitment;
        user.isVerified = true;
        user.isOnChain = false; // Ensure it's marked as pending
        await user.save();

        // Check batch size
        const BATCH_SIZE = 5; // Set to 5 for testing, 50 for prod
        const pendingUsers = await User.find({ isVerified: true, isOnChain: false });

        if (pendingUsers.length >= BATCH_SIZE) {
            console.log(`Batch verification triggered for ${pendingUsers.length} users...`);
            // Mock Smart Contract Call
            // const tx = await feedbackContract.batchAddMembers(pendingUsers.map(u => u.identityCommitment));
            // await tx.wait();

            console.log("Mock: Batch added to blockchain.");

            // Mark as onChain
            for (const u of pendingUsers) {
                u.isOnChain = true;
                await u.save();
            }
        }

        res.json({ msg: 'Identity added to queue', commitment: identityCommitment, pendingCount: pendingUsers.length });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Force Batch Processing
router.post('/force-batch', isAdmin, async (req, res) => {
    try {
        const pendingUsers = await User.find({ isVerified: true, isOnChain: false });

        if (pendingUsers.length === 0) {
            return res.json({ msg: 'No pending users to process', count: 0 });
        }

        console.log(`Forcing batch processing for ${pendingUsers.length} users...`);

        // Mock Blockchain Transaction
        // const tx = await feedbackContract.batchAddMembers(pendingUsers.map(u => u.identityCommitment));
        // await tx.wait();

        // Mark as onChain
        for (const u of pendingUsers) {
            u.isOnChain = true;
            await u.save();
        }

        res.json({ msg: 'Batch processed successfully', count: pendingUsers.length });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
