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