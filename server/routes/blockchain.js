const express = require('express');
const router = express.Router();
const blockchain = require('../blockchain/ledger');

// View the full blockchain ledger
router.get('/ledger', (req, res) => {
    res.json(blockchain.ledger);
});

// View summary of all chains
router.get('/summary', (req, res) => {
    res.json(blockchain.getSummary());
});

// View a specific chain (e.g., /api/blockchain/chain/feedback_forms)
router.get('/chain/:name', (req, res) => {
    const chain = blockchain.ledger[req.params.name];
    if (!chain) return res.status(404).json({ msg: `Chain "${req.params.name}" not found` });
    res.json(chain);
});

// Validate a specific chain's integrity
router.get('/validate/:name', (req, res) => {
    const result = blockchain.validateChain(req.params.name);
    res.json(result);
});

module.exports = router;
