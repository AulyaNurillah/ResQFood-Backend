const { body, validationResult } = require('express-validator');

const { body, validationResult } = require('express-validator');

exports.validateRegister = [
    body('email').isEmail().normalizeEmail().withMessage('Email tidak valid'),
    body('fullName').notEmpty().withMessage('Nama lengkap wajib diisi'),
    body('phone')
        .optional()
        .custom(value => {
            // Hapus semua karakter non-digit
            const digits = value.replace(/\D/g, '');
            // Cek panjang antara 10 dan 13 digit
            if (digits.length < 10 || digits.length > 13) {
                throw new Error('Nomor HP harus 10-13 digit');
            }
            return true;
        })
        .withMessage('Nomor HP tidak valid (10-13 digit)'),
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