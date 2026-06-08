const supabase = require('../config/supabase');

exports.getPeriodicStats = async (req, res) => {
    const { period = 'monthly', startDate, endDate } = req.query;

    try {
        // Total users
        const { count: totalUsers } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        // Total products
        const { count: totalProducts } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true });

        // Orders dalam periode
        let query = supabase
            .from('orders')
            .select('created_at, total_price, status');
        if (startDate) query = query.gte('created_at', startDate);
        if (endDate) query = query.lte('created_at', endDate);
        const { data: orders, error } = await query;
        if (error) throw error;

        const totalOrders = orders.length;
        const completedOrders = orders.filter(o => o.status === 'selesai');
        const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);

        // Agregasi per periode
        const statsByPeriod = {};
        orders.forEach(order => {
            const date = new Date(order.created_at);
            let key;
            if (period === 'daily') key = date.toISOString().split('T')[0];
            else if (period === 'weekly') key = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
            else key = `${date.getFullYear()}-${date.getMonth() + 1}`;

            if (!statsByPeriod[key]) {
                statsByPeriod[key] = { totalOrders: 0, totalRevenue: 0, completedOrders: 0 };
            }
            statsByPeriod[key].totalOrders++;
            if (order.status === 'selesai') {
                statsByPeriod[key].completedOrders++;
                statsByPeriod[key].totalRevenue += order.total_price || 0;
            }
        });

        res.json({
            summary: { totalUsers, totalProducts, totalOrders, completedOrders: completedOrders.length, totalRevenue },
            period,
            data: statsByPeriod,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// ... sebelumnya sudah ada getPeriodicStats mungkin, tambahkan ini:

exports.getBuyerStats = async (req, res) => {
    const userId = req.user.id;
    try {
        // Total orders by buyer
        const { data: orders, error } = await supabase
            .from('orders')
            .select('total_price, status, created_at')
            .eq('buyer_id', userId);
        if (error) throw error;

        const totalOrders = orders.length;
        const completedOrders = orders.filter(o => o.status === 'selesai');
        const totalSpent = completedOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
        const pendingOrders = orders.filter(o => o.status === 'menunggu_konfirmasi_penjual').length;
        const acceptedOrders = orders.filter(o => o.status === 'diterima_penjual').length;

        // Optional: number of unique sellers bought from
        const uniqueSellers = new Set(orders.map(o => o.seller_id)).size;

        res.json({
            totalOrders,
            completedOrders: completedOrders.length,
            totalSpent,
            pendingOrders,
            acceptedOrders,
            uniqueSellers,
            // bisa juga tambah breakdown per bulan jika perlu
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

exports.getSellerStats = async (req, res) => {
    const userId = req.user.id;
    try {
        // Total products sold via orders
        const { data: orders, error } = await supabase
            .from('orders')
            .select('quantity, total_price, status, created_at')
            .eq('seller_id', userId);
        if (error) throw error;

        const totalOrders = orders.length;
        const completedOrders = orders.filter(o => o.status === 'selesai');
        const totalItemsSold = completedOrders.reduce((sum, o) => sum + (o.quantity || 0), 0);
        const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
        const pendingOrders = orders.filter(o => o.status === 'menunggu_konfirmasi_penjual').length;
        const acceptedOrders = orders.filter(o => o.status === 'diterima_penjual').length;

        // Average rating from ratings table
        const { data: ratings } = await supabase
            .from('ratings')
            .select('rating')
            .eq('seller_id', userId);
        const avgRating = ratings.length ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1) : 0;

        res.json({
            totalOrders,
            completedOrders: completedOrders.length,
            totalItemsSold,
            totalRevenue,
            pendingOrders,
            acceptedOrders,
            averageRating: avgRating,
            totalRatings: ratings.length
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};