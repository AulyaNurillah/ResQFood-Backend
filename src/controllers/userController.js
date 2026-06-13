const supabase = require('../config/supabase');
const path = require('path');
const jwt = require('jsonwebtoken');


// Get profile
exports.getProfile = async (req, res) => {
    const userId = req.user.id;
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, email, full_name, phone, roles, address, latitude, longitude, created_at')
            .eq('id', userId)
            .single();
        if (error || !data) return res.status(404).json({ error: 'User not found' });
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

// Update profile
exports.updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { fullName, phone, address, latitude, longitude } = req.body;
    try {
        const { data, error } = await supabase
            .from('users')
            .update({ full_name: fullName, phone, address, latitude, longitude })
            .eq('id', userId)
            .select();
        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

// Upgrade to seller
exports.upgradeToSeller = async (req, res) => {
    const userId = req.user.id;
    try {
        // Ambil user saat ini
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('id, email, roles')
            .eq('id', userId)
            .single();

        if (fetchError || !user) {
            return res.status(404).json({ error: 'User not found' });
        }

        let roles = user.roles || ['pembeli'];
        if (roles.includes('penjual')) {
            return res.status(400).json({ error: 'Already a seller' });
        }

        roles.push('penjual');

        // Update role di database
        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({ roles })
            .eq('id', userId)
            .select();

        if (updateError) throw updateError;

        // Generate token baru dengan role terbaru
        const newToken = jwt.sign(
            { id: updatedUser[0].id, email: updatedUser[0].email, roles: updatedUser[0].roles },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Kirim response berisi user dan token baru
        res.json({
            ...updatedUser[0],
            token: newToken
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Soft delete user (set is_deleted = true) – but we need to add column first
// I'll add is_deleted column handling. If column doesn't exist, we can ignore or add.
exports.deleteUser = async (req, res) => {
    const userId = req.user.id;
    try {
        // Soft delete: set is_deleted = true (assuming column exists)
        const { error } = await supabase
            .from('users')
            .update({ is_deleted: true })
            .eq('id', userId);
        if (error) throw error;
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};

exports.registerAsSeller = async (req, res) => {
    const userId = req.user.id;
    const {
        storeName, storeDescription, storeAddress, storePhone,
        bankName, bankAccountNumber, bankAccountName,
        idCardNumber, idCardImageUrl
    } = req.body;

    if (!storeName || !storeAddress || !idCardNumber) {
        return res.status(400).json({ error: 'Store name, address, and ID card are required' });
    }

    try {
        // Cek apakah sudah punya profile
        const { data: existing } = await supabase
            .from('seller_profiles')
            .select('id')
            .eq('user_id', userId)
            .single();
        if (existing) {
            return res.status(400).json({ error: 'Already registered as seller' });
        }

        const { data, error } = await supabase
            .from('seller_profiles')
            .insert([{
                user_id: userId,
                store_name: storeName,
                store_description: storeDescription,
                store_address: storeAddress,
                store_phone: storePhone,
                bank_name: bankName,
                bank_account_number: bankAccountNumber,
                bank_account_name: bankAccountName,
                id_card_number: idCardNumber,
                id_card_image_url: idCardImageUrl,
                is_verified: false
            }])
            .select();

        if (error) throw error;

        // Tambah role 'penjual' ke user
        const { data: user } = await supabase
            .from('users')
            .select('roles')
            .eq('id', userId)
            .single();
        const newRoles = [...(user.roles || ['pembeli']), 'penjual'];
        await supabase
            .from('users')
            .update({ roles: newRoles })
            .eq('id', userId);

        res.status(201).json({
            message: 'Seller registration submitted, waiting for verification',
            profile: data[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

exports.getSellerStatus = async (req, res) => {
    const userId = req.user.id;
    try {
        const { data, error } = await supabase
            .from('seller_profiles')
            .select('is_verified, store_name')
            .eq('user_id', userId)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        res.json({ isVerified: data?.is_verified || false, profile: data || null });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Statistik untuk pembeli (riwayat order, total belanja, dll)
exports.getBuyerStats = async (req, res) => {
    const userId = req.user.id;
    try {
        // Total order yang dibuat pembeli
        const { data: orders, error: orderErr } = await supabase
            .from('orders')
            .select('id, total_price, status, created_at')
            .eq('buyer_id', userId);
        if (orderErr) throw orderErr;

        const totalOrders = orders.length;
        const completedOrders = orders.filter(o => o.status === 'selesai');
        const totalSpent = completedOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
        const pendingOrders = orders.filter(o => o.status === 'menunggu_konfirmasi_penjual').length;

        // Jumlah produk unik yang pernah dibeli
        const { data: products, error: prodErr } = await supabase
            .from('orders')
            .select('product_id')
            .eq('buyer_id', userId);
        const uniqueProducts = new Set(products.map(p => p.product_id)).size;

        res.json({
            totalOrders,
            completedOrders: completedOrders.length,
            totalSpent,
            pendingOrders,
            uniqueProductsPurchased: uniqueProducts
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Statistik untuk penjual (kinerja toko)
exports.getSellerStats = async (req, res) => {
    const userId = req.user.id;
    try {
        // Cek apakah user benar penjual
        const { data: sellerProfile } = await supabase
            .from('seller_profiles')
            .select('id')
            .eq('user_id', userId)
            .single();
        if (!sellerProfile) {
            return res.status(403).json({ error: 'Anda bukan penjual' });
        }

        // Total produk yang dijual
        const { count: totalProducts, error: prodErr } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('seller_id', userId);
        if (prodErr) throw prodErr;

        // Order yang masuk ke toko
        const { data: orders, error: orderErr } = await supabase
            .from('orders')
            .select('id, total_price, status, created_at')
            .eq('seller_id', userId);
        if (orderErr) throw orderErr;

        const totalOrders = orders.length;
        const completedOrders = orders.filter(o => o.status === 'selesai');
        const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
        const pendingConfirm = orders.filter(o => o.status === 'menunggu_konfirmasi_penjual').length;

        // Rata-rata rating (nanti dari tabel ratings)
        const { data: ratings, error: ratingErr } = await supabase
            .from('ratings')
            .select('rating')
            .eq('seller_id', userId);
        let averageRating = 0;
        if (ratings && ratings.length > 0) {
            averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        }

        res.json({
            totalProducts,
            totalOrders,
            completedOrders: completedOrders.length,
            totalRevenue,
            pendingConfirmations: pendingConfirm,
            averageRating
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

exports.getMyStats = async (req, res) => {
    const userId = req.user.id;
    const roles = req.user.roles;
    try {
        if (roles.includes('pembeli')) {
            // statistik pembeli
            const { data: orders } = await supabase
                .from('orders')
                .select('total_price, status')
                .eq('buyer_id', userId);
            const totalSpent = orders.filter(o => o.status === 'selesai').reduce((sum, o) => sum + (o.total_price || 0), 0);
            const totalOrders = orders.length;
            const { count: ratingsGiven } = await supabase
                .from('seller_ratings')
                .select('id', { count: 'exact', head: true })
                .eq('buyer_id', userId);
            return res.json({ role: 'pembeli', totalOrders, totalSpent, ratingsGiven });
        } else if (roles.includes('penjual')) {
            // statistik penjual
            const { data: products } = await supabase
                .from('products')
                .select('id')
                .eq('seller_id', userId);
            const totalProducts = products.length;
            const { data: orders } = await supabase
                .from('orders')
                .select('total_price, status')
                .eq('seller_id', userId);
            const totalSales = orders.filter(o => o.status === 'selesai').reduce((sum, o) => sum + (o.total_price || 0), 0);
            const totalOrders = orders.length;
            const { data: ratings } = await supabase
                .from('seller_ratings')
                .select('rating')
                .eq('seller_id', userId);
            const avgRating = ratings.length > 0 ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0;
            return res.json({ role: 'penjual', totalProducts, totalOrders, totalSales, averageRating: avgRating.toFixed(1) });
        }
        res.status(403).json({ error: 'Unknown role' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Upload profile picture (avatar)
exports.uploadProfilePicture = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const userId = req.user.id;
    const file = req.file;
    const fileName = `avatars/${userId}-${Date.now()}${path.extname(file.originalname)}`;
    const filePath = fileName;

    try {
        const { data, error } = await supabase.storage
            .from('avatars') // pastikan bucket 'avatars' sudah dibuat di Supabase Storage (public)
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                cacheControl: '3600',
                upsert: true,
            });
        if (error) throw error;

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        const avatarUrl = urlData.publicUrl;

        // Update user profile with avatar_url
        const { error: updateError } = await supabase
            .from('users')
            .update({ avatar_url: avatarUrl })
            .eq('id', userId);
        if (updateError) throw updateError;

        res.json({ message: 'Profile picture updated', avatarUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};