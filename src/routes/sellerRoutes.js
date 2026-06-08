const express = require('express');
const sellerController = require('../controllers/sellerController');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Sellers
 *   description: Seller information and location
 */

/**
 * @swagger
 * /api/sellers/nearby:
 *   get:
 *     summary: Get sellers near a location (by lat/lng)
 *     tags: [Sellers]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema: { type: number }
 *       - in: query
 *         name: lng
 *         required: true
 *         schema: { type: number }
 *       - in: query
 *         name: radius
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: List of sellers with distance
 */
router.get('/nearby', sellerController.getNearbySellers);

/**
 * @swagger
 * /api/sellers/{sellerId}:
 *   get:
 *     summary: Get detailed seller profile by seller_profile id
 *     tags: [Sellers]
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Seller details
 */
router.get('/:sellerId', sellerController.getSellerDetail);

module.exports = router;