const express = require('express');
const authMiddleware = require('../middleware/auth');
const { getProfile, updateProfile, upgradeToSeller, deleteUser, registerAsSeller, getSellerStatus } = require('../controllers/userController');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User profile management
 */

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [User]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Profile data
 */
router.get('/profile', authMiddleware, getProfile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [User]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName: { type: string }
 *               phone: { type: string }
 *               address: { type: string }
 *               latitude: { type: number }
 *               longitude: { type: number }
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/profile', authMiddleware, updateProfile);

/**
 * @swagger
 * /api/users/upgradetoseller:
 *   post:
 *     summary: Upgrade current user to seller role
 *     tags: [User]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: User upgraded to seller
 *       400:
 *         description: Already a seller
 */
router.post('/upgradetoseller', authMiddleware, upgradeToSeller);

/**
 * @swagger
 * /api/users:
 *   delete:
 *     summary: Soft delete user account
 *     tags: [User]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       204:
 *         description: Account deleted
 */
router.delete('/', authMiddleware, deleteUser);

/**
 * @swagger
 * /api/users/register-seller:
 *   post:
 *     summary: Register as seller with detailed store information
 *     tags: [User]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [storeName, storeAddress, idCardNumber]
 *             properties:
 *               storeName: { type: string }
 *               storeDescription: { type: string }
 *               storeAddress: { type: string }
 *               storePhone: { type: string }
 *               bankName: { type: string }
 *               bankAccountNumber: { type: string }
 *               bankAccountName: { type: string }
 *               idCardNumber: { type: string }
 *               idCardImageUrl: { type: string }
 *     responses:
 *       201:
 *         description: Seller registration submitted
 *       400:
 *         description: Missing required fields or already seller
 *       500:
 *         description: Failed to register
 */
router.post('/registerseller', authMiddleware, registerAsSeller);

/**
 * @swagger
 * /api/users/seller-status:
 *   get:
 *     summary: Get seller verification status
 *     tags: [User]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Returns isVerified and profile data
 *       500:
 *         description: Failed to fetch status
 */
router.get('/sellerstatus', authMiddleware, getSellerStatus);

module.exports = router;