const express = require('express');
const authMiddleware = require('../middleware/auth');
const { getBuyerStats, getSellerStats } = require('../controllers/statsController');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Stats
 *   description: Personal statistics for buyer and seller
 */

/**
 * @swagger
 * /api/stats/buyer:
 *   get:
 *     summary: Get statistics for logged-in buyer
 *     tags: [Stats]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Buyer stats (total orders, spent, etc.)
 */
router.get('/buyer', authMiddleware, getBuyerStats);

/**
 * @swagger
 * /api/stats/seller:
 *   get:
 *     summary: Get statistics for logged-in seller
 *     tags: [Stats]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Seller stats (items sold, revenue, rating, etc.)
 */
router.get('/seller', authMiddleware, getSellerStats);

module.exports = router;