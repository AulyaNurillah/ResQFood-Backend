/**
 * @swagger
 * /api/upload/product-image:
 *   post:
 *     summary: Upload product image to Supabase Storage
 *     tags: [Upload]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Upload success, returns URL
 *       400:
 *         description: No file uploaded
 *       500:
 *         description: Upload failed
 */
app.post('/api/upload/product-image', uploadController.upload, uploadController.uploadProductImage);