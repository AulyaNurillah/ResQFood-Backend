const { body, validationResult } = require('express-validator');

exports.validateRegister = [
    body('email').isEmail().normalizeEmail().withMessage('Email tidak valid'),
    body('fullName').notEmpty().withMessage('Nama lengkap wajib diisi'),
    body('phone').optional().isMobilePhone('id-ID').withMessage('Nomor HP tidak valid'),
    body('password')
        .isLength({ min: 8 }).withMessage('Password minimal 8 karakter')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .withMessage('Password harus mengandung huruf besar, huruf kecil, angka, dan simbol'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];