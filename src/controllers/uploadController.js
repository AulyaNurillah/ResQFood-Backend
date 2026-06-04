const supabase = require('../config/supabase');
const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) return cb(null, true);
        cb(new Error('Only images are allowed'));
    }
});

exports.upload = upload.single('image');

exports.uploadProductImage = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    const filePath = `products/${fileName}`;

    try {
        const { data, error } = await supabase.storage
            .from('product-images')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                cacheControl: '3600',
                upsert: false,
            });
        if (error) throw error;

        const { data: urlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);

        res.json({
            message: 'Upload successful',
            url: urlData.publicUrl,
            path: filePath
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};