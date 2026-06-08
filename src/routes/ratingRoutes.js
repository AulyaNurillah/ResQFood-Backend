const express = require('express');
const authMiddleware = require('../middleware/auth');
const ratingController = require('../controllers/ratingController');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Ratings
 *   description: Rating and review for sellers
 */

/**
 * @swagger
 * /api/ratings:
 *   post:
 *     summary: Submit rating for a completed order
 *     tags: [Ratings]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, rating]
 *             properties:
 *               orderId: { type: string }
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *               review: { type: string }
 *     responses:
 *       201:
 *         description: Rating submitted
 */
router.post('/', authMiddleware, ratingController.createRating);

/**
 * @swagger
 * /api/ratings/seller/{sellerId}:
 *   get:
 *     summary: Get all ratings and average for a seller
 *     tags: [Ratings]
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of ratings and average
 */
router.get('/seller/:sellerId', ratingController.getSellerRatings);

module.exports = router;