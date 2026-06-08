const supabase = require('../config/supabase');

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
        const { data: user } = await supabase.from('users').select('roles').eq('id', userId).single();
        if (!user) return res.status(404).json({ error: 'User not found' });
        let roles = user.roles || ['pembeli'];
        if (roles.includes('penjual')) {
            return res.status(400).json({ error: 'Already a seller' });
        }
        roles.push('penjual');
        const { data, error } = await supabase
            .from('users')
            .update({ roles })
            .eq('id', userId)
            .select();
        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to upgrade' });
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

// Statistik untuk pembeli
exports.getBuyerStats = async (req, res) => {
    const userId = req.user.id;
    try {
        // Ambil semua order pembeli
        const { data: orders, error } = await supabase
            .from('orders')
            .select('status, total_price')
            .eq('buyer_id', userId);
        if (error) throw error;

        const totalOrders = orders.length;
        const completedOrders = orders.filter(o => o.status === 'selesai').length;
        const totalSpent = orders
            .filter(o => o.status === 'selesai')
            .reduce((sum, o) => sum + (o.total_price || 0), 0);
        const avgOrder = totalSpent / (completedOrders || 1);

        res.json({
            totalOrders,
            completedOrders,
            totalSpent,
            averageOrderValue: avgOrder,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Statistik untuk penjual
exports.getSellerStats = async (req, res) => {
    const userId = req.user.id;
    try {
        // Produk yang dijual oleh penjual ini
        const { data: products, error: prodErr } = await supabase
            .from('products')
            .select('id, name, stock')
            .eq('seller_id', userId);
        if (prodErr) throw prodErr;

        // Order yang masuk ke penjual ini
        const { data: orders, error: orderErr } = await supabase
            .from('orders')
            .select('status, total_price, quantity, product_id')
            .eq('seller_id', userId);
        if (orderErr) throw orderErr;

        const totalProducts = products.length;
        const totalOrders = orders.length;
        const completedOrders = orders.filter(o => o.status === 'selesai').length;
        const totalRevenue = orders
            .filter(o => o.status === 'selesai')
            .reduce((sum, o) => sum + (o.total_price || 0), 0);
        // Total unit terjual (quantity dari order selesai)
        const totalUnitsSold = orders
            .filter(o => o.status === 'selesai')
            .reduce((sum, o) => sum + (o.quantity || 0), 0);

        res.json({
            totalProducts,
            totalOrders,
            completedOrders,
            totalRevenue,
            totalUnitsSold,
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