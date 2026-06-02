const express = require('express');
const {
    createOrder,
    acceptOrder,
    scanQr,
    cancelOrder,
    getMyOrders,
    getMySales,
    getOrderById
} = require('../controllers/orderController');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management endpoints
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create new order (checkout)
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, quantity]
 *             properties:
 *               productId: { type: string }
 *               quantity: { type: integer }
 *     responses:
 *       201:
 *         description: Order created
 */
router.post('/', authMiddleware, acceptOrder);

/**
 * @swagger
 * /api/orders/{id}/accept:
 *   put:
 *     summary: Accept an order (seller) and generate QR token
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId]
 *             properties:
 *               orderId: { type: string }
 *     responses:
 *       200:
 *         description: Order accepted, QR token generated
 */
router.put('/:id/accept', authMiddleware, acceptOrder);

/**
 * @swagger
 * /api/orders/scan:
 *   post:
 *     summary: Scan QR token by seller to complete order
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [qrToken]
 *             properties:
 *               qrToken: { type: string }
 *     responses:
 *       200:
 *         description: Order completed
 */
router.post('/scan', authMiddleware, scanQr);

/**
 * @swagger
 * /api/orders/myorders:
 *   get:
 *     summary: Get all orders as buyer
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of orders made by buyer
 */
router.get('/my-orders', authMiddleware, getMyOrders);

/**
 * @swagger
 * /api/orders/mysales:
 *   get:
 *     summary: Get all orders as seller
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of orders for seller
 */
router.get('/my-sales', authMiddleware, getMySales);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order details by ID
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Order details
 *       403:
 *         description: Access denied
 *       404:
 *         description: Order not found
 */
router.get('/:id', authMiddleware, getOrderById);

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   put:
 *     summary: Cancel an order (buyer or seller)
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Order cancelled
 */
router.put('/:id/cancel', authMiddleware, cancelOrder);

module.exports = router;