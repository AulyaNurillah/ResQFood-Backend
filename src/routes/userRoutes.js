const express = require('express');
const { getProfile, updateProfile, upgradeToSeller, deleteUser } = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
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
router.post('/upgrade-to-seller', authMiddleware, upgradeToSeller);

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

module.exports = router;