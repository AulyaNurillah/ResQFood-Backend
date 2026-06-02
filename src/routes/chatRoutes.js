const express = require('express');
const {
    sendMessage,
    getMessages,
    markMessageAsRead,
    deleteMessage
} = require('../controllers/chatController');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Chat endpoints
 */

/**
 * @swagger
 * /api/chat/send:
 *   post:
 *     summary: Send a message in an order chat
 *     tags: [Chat]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, message]
 *             properties:
 *               orderId: { type: string }
 *               message: { type: string }
 *     responses:
 *       201:
 *         description: Message sent
 */
router.post('/send', authMiddleware, sendMessage);

/**
 * @swagger
 * /api/chat/order/{orderId}:
 *   get:
 *     summary: Get all messages for an order
 *     tags: [Chat]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of messages
 */
router.get('/order/:orderId', authMiddleware, getMessages);

/**
 * @swagger
 * /api/chat/messages/{messageId}/read:
 *   put:
 *     summary: Mark a message as read
 *     tags: [Chat]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Marked as read
 */
router.put('/messages/:messageId/read', authMiddleware, markMessageAsRead);

/**
 * @swagger
 * /api/chat/messages/{messageId}:
 *   delete:
 *     summary: Delete a message (sender or receiver)
 *     tags: [Chat]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Message deleted
 */
router.delete('/messages/:messageId', authMiddleware, deleteMessage);

module.exports = router;