const express = require('express');
const sellerController = require('../controllers/sellerController');
const router = express.Router();

/**
 * @swagger
 * /api/sellers/nearby:
 *   get:
 *     summary: Get sellers near a location
 *     tags: [Sellers]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema: { type: number }
 *         description: Latitude
 *       - in: query
 *         name: lng
 *         required: true
 *         schema: { type: number }
 *         description: Longitude
 *       - in: query
 *         name: radius
 *         schema: { type: number, default: 10 }
 *         description: Radius in km
 *     responses:
 *       200:
 *         description: List of nearby sellers with distance
 */
router.get('/nearby', sellerController.getNearbySellers);

/**
 * @swagger
 * /api/sellers/{sellerId}:
 *   get:
 *     summary: Get detailed seller profile
 *     tags: [Sellers]
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Seller details including average rating
 */
router.get('/:sellerId', sellerController.getSellerDetail);

module.exports = router;