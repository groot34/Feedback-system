/**
 * Local Blockchain Ledger
 * 
 * A lightweight, file-backed blockchain implementation that records
 * all feedback system events (form creation, submissions, approvals,
 * identity commitments, batch processing) as mined blocks in a
 * local JSON file.
 * 
 * This does NOT affect any existing app functionality. It simply
 * observes events and writes them to blockchain_ledger.json so
 * you can inspect the chain.
 * 
 * Proof-of-Work: Each block is mined with a configurable difficulty
 * (number of leading zeros in the hash).
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const LEDGER_PATH = path.join(__dirname, '..', 'blockchain_ledger.json');
const DIFFICULTY = 4; // Number of leading zeros required

// ─── Block Class ────────────────────────────────────────────────
class Block {
    constructor(index, timestamp, transactions, prevHash) {
        this.index = index;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.prev_hash = prevHash;
        this.nonce = 0;
        this.hash = '';
    }

    calculateHash() {
        const data = JSON.stringify({
            index: this.index,
            timestamp: this.timestamp,
            transactions: this.transactions,
            prev_hash: this.prev_hash,
            nonce: this.nonce
        });
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    mine(difficulty) {
        const target = '0'.repeat(difficulty);
        while (!this.hash.startsWith(target)) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
        return this;
    }
}

// ─── Chain Manager ──────────────────────────────────────────────
class FeedbackBlockchain {
    constructor() {
        this.ledger = this._load();
    }

    /**
     * Load the ledger from disk, or initialize a fresh one with
     * genesis blocks for each chain category.
     */
    _load() {
        if (fs.existsSync(LEDGER_PATH)) {
            try {
                const raw = fs.readFileSync(LEDGER_PATH, 'utf-8');
                return JSON.parse(raw);
            } catch (err) {
                console.error('[Blockchain] Corrupt ledger file, re-initializing...', err.message);
            }
        }
        return this._initializeLedger();
    }

    _initializeLedger() {
        const now = Date.now();
        const ledger = {
            _meta: {
                version: '1.0.0',
                difficulty: DIFFICULTY,
                createdAt: new Date(now).toISOString(),
                description: 'Local blockchain ledger for IIITM Anonymous Feedback System'
            },
            feedback_forms: {
                type: 'feedback_forms',
                difficulty: DIFFICULTY,
                chain: [this._createGenesisBlock('Feedback Forms', now)],
                metadata: { totalForms: 0, lastUpdated: now }
            },
            feedback_submissions: {
                type: 'feedback_submissions',
                difficulty: DIFFICULTY,
                chain: [this._createGenesisBlock('Feedback Submissions', now)],
                metadata: { totalSubmissions: 0, lastUpdated: now }
            },
            approvals: {
                type: 'approvals',
                difficulty: DIFFICULTY,
                chain: [this._createGenesisBlock('Approvals', now)],
                metadata: { totalApprovals: 0, lastUpdated: now }
            },
            identity_commitments: {
                type: 'identity_commitments',
                difficulty: DIFFICULTY,
                chain: [this._createGenesisBlock('Identity Commitments', now)],
                metadata: { totalCommitments: 0, lastUpdated: now }
            },
            batch_operations: {
                type: 'batch_operations',
                difficulty: DIFFICULTY,
                chain: [this._createGenesisBlock('Batch Operations', now)],
                metadata: { totalBatches: 0, lastUpdated: now }
            }
        };

        this._save(ledger);
        console.log('[Blockchain] Genesis ledger created at', LEDGER_PATH);
        return ledger;
    }

    _createGenesisBlock(name, timestamp) {
        const block = new Block(0, timestamp, {
            type: 'genesis',
            message: `Genesis block for chain: ${name}`,
            data: {}
        }, '0');
        block.mine(DIFFICULTY);
        return {
            index: block.index,
            timestamp: block.timestamp,
            transactions: block.transactions,
            prev_hash: block.prev_hash,
            nonce: block.nonce,
            hash: block.hash
        };
    }

    _save(ledgerOverride) {
        const data = ledgerOverride || this.ledger;
        fs.writeFileSync(LEDGER_PATH, JSON.stringify(data, null, 2), 'utf-8');
    }

    /**
     * Add a new block to a specific chain category.
     */
    _addBlock(chainName, transactionData) {
        const chain = this.ledger[chainName];
        if (!chain) {
            console.error(`[Blockchain] Unknown chain: ${chainName}`);
            return null;
        }

        const lastBlock = chain.chain[chain.chain.length - 1];
        const now = Date.now();

        const block = new Block(
            lastBlock.index + 1,
            now,
            { ...transactionData, timestamp: now },
            lastBlock.hash
        );
        block.mine(DIFFICULTY);

        const serialized = {
            index: block.index,
            timestamp: block.timestamp,
            transactions: block.transactions,
            prev_hash: block.prev_hash,
            nonce: block.nonce,
            hash: block.hash
        };

        chain.chain.push(serialized);
        chain.metadata.lastUpdated = now;

        this._save();
        console.log(`[Blockchain] Block #${serialized.index} mined on [${chainName}] | Hash: ${serialized.hash.substring(0, 16)}...`);
        return serialized;
    }

    // ─── Public API: Record Events ──────────────────────────────

    /**
     * Record a new feedback form being created.
     */
    recordFormCreated(formId, title, assignedFaculty) {
        this.ledger.feedback_forms.metadata.totalForms++;
        return this._addBlock('feedback_forms', {
            type: 'form_created',
            action: 'create',
            formId: String(formId),
            formTitle: title,
            assignedFaculty: String(assignedFaculty || 'unassigned'),
            status: 'active'
        });
    }

    /**
     * Record a feedback form being deleted.
     */
    recordFormDeleted(formId) {
        return this._addBlock('feedback_forms', {
            type: 'form_deleted',
            action: 'delete',
            formId: String(formId),
            status: 'deleted'
        });
    }

    /**
     * Record a feedback form being closed.
     */
    recordFormClosed(formId) {
        return this._addBlock('feedback_forms', {
            type: 'form_closed',
            action: 'close',
            formId: String(formId),
            status: 'closed'
        });
    }

    /**
     * Record a student submitting feedback.
     * Student identity is hashed for anonymity on the ledger.
     */
    recordSubmission(formId, studentId, answerCount) {
        this.ledger.feedback_submissions.metadata.totalSubmissions++;
        // Hash the studentId so the ledger doesn't reveal who submitted
        const anonHash = crypto.createHash('sha256')
            .update(String(studentId) + String(formId))
            .digest('hex');

        return this._addBlock('feedback_submissions', {
            type: 'feedback_submitted',
            action: 'submit',
            formId: String(formId),
            anonymousStudentHash: anonHash,
            answerCount: answerCount,
            status: 'submitted'
        });
    }

    /**
     * Record an approval toggle on a single response.
     */
    recordApprovalToggle(responseId, approved) {
        this.ledger.approvals.metadata.totalApprovals++;
        return this._addBlock('approvals', {
            type: 'approval_toggle',
            action: approved ? 'approve' : 'revoke',
            responseId: String(responseId),
            approved: approved,
            status: approved ? 'approved' : 'revoked'
        });
    }

    /**
     * Record a bulk approve/revoke for all responses of a form.
     */
    recordBulkApproval(formId, approved, modifiedCount) {
        this.ledger.approvals.metadata.totalApprovals++;
        return this._addBlock('approvals', {
            type: 'bulk_approval',
            action: approved ? 'bulk_approve' : 'bulk_revoke',
            formId: String(formId),
            modifiedCount: modifiedCount,
            approved: approved,
            status: approved ? 'all_approved' : 'all_revoked'
        });
    }

    /**
     * Record a student identity commitment being submitted.
     */
    recordIdentityCommitment(userId, commitment) {
        this.ledger.identity_commitments.metadata.totalCommitments++;
        // Hash the userId for privacy
        const anonUserHash = crypto.createHash('sha256')
            .update(String(userId))
            .digest('hex');

        return this._addBlock('identity_commitments', {
            type: 'identity_committed',
            action: 'commit',
            anonymousUserHash: anonUserHash,
            commitmentPrefix: commitment ? commitment.substring(0, 16) + '...' : 'N/A',
            status: 'pending_on_chain'
        });
    }

    /**
     * Record a batch of identities being pushed on-chain.
     */
    recordBatchProcessed(userCount, commitments) {
        this.ledger.batch_operations.metadata.totalBatches++;
        return this._addBlock('batch_operations', {
            type: 'batch_processed',
            action: 'batch_push',
            userCount: userCount,
            commitmentHashes: (commitments || []).map(c =>
                crypto.createHash('sha256').update(String(c)).digest('hex').substring(0, 12)
            ),
            status: 'on_chain'
        });
    }

    /**
     * Validate the integrity of a specific chain.
     * Returns { valid: boolean, errors: string[] }
     */
    validateChain(chainName) {
        const chain = this.ledger[chainName]?.chain;
        if (!chain) return { valid: false, errors: [`Chain "${chainName}" not found`] };

        const errors = [];
        for (let i = 1; i < chain.length; i++) {
            if (chain[i].prev_hash !== chain[i - 1].hash) {
                errors.push(`Block #${i}: prev_hash mismatch (expected ${chain[i - 1].hash}, got ${chain[i].prev_hash})`);
            }
        }
        return { valid: errors.length === 0, errors };
    }

    /**
     * Get a summary of all chains for quick inspection.
     */
    getSummary() {
        const summary = {};
        for (const [key, val] of Object.entries(this.ledger)) {
            if (key === '_meta') continue;
            summary[key] = {
                blocks: val.chain.length,
                lastHash: val.chain[val.chain.length - 1]?.hash?.substring(0, 20) + '...',
                metadata: val.metadata
            };
        }
        return summary;
    }
}

// Export a singleton instance
const blockchain = new FeedbackBlockchain();
module.exports = blockchain;
