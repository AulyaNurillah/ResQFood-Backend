const express = require('express');
const {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/roleMiddleware');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management endpoints
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products (public)
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by product name
 *       - in: query
 *         name: minPrice
 *         schema: { type: integer }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of products
 */
router.get('/', getAllProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
router.get('/:id', getProductById);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create new product (seller only)
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price, stock]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               price: { type: integer }
 *               stock: { type: integer }
 *               imageUrl: { type: string }
 *               pickupStart: { type: string, format: date-time }
 *               pickupEnd: { type: string, format: date-time }
 *               expiredDate: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Product created
 */
router.post('/', authMiddleware, roleMiddleware(['penjual']), createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update product (seller only)
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               price: { type: integer }
 *               stock: { type: integer }
 *               imageUrl: { type: string }
 *               pickupStart: { type: string, format: date-time }
 *               pickupEnd: { type: string, format: date-time }
 *               expiredDate: { type: string, format: date-time }
 *               status: { type: string }
 *     responses:
 *       200:
 *         description: Product updated
 */
router.put('/:id', authMiddleware, roleMiddleware(['penjual']), updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete product (seller only)
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Product deleted
 */
router.delete('/:id', authMiddleware, roleMiddleware(['penjual']), deleteProduct);

module.exports = router;