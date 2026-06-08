const supabase = require('../config/supabase');

exports.rateSeller = async (req, res) => {
    const { orderId, rating, comment } = req.body;
    const buyerId = req.user.id;

    if (!orderId || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Order ID and rating (1-5) are required' });
    }

    try {
        // Verifikasi order milik buyer dan sudah selesai
        const { data: order, error: orderErr } = await supabase
            .from('orders')
            .select('seller_id, status')
            .eq('id', orderId)
            .eq('buyer_id', buyerId)
            .single();
        if (orderErr || !order) return res.status(404).json({ error: 'Order not found' });
        if (order.status !== 'selesai') return res.status(400).json({ error: 'Can only rate completed orders' });

        // Cek apakah sudah pernah rating untuk order ini
        const { data: existing } = await supabase
            .from('ratings')
            .select('id')
            .eq('order_id', orderId)
            .maybeSingle();
        if (existing) return res.status(400).json({ error: 'Already rated this order' });

        const { data, error } = await supabase
            .from('ratings')
            .insert([{
                order_id: orderId,
                seller_id: order.seller_id,
                buyer_id: buyerId,
                rating,
                comment: comment || null
            }])
            .select();
        if (error) throw error;
        res.status(201).json({ message: 'Rating submitted', rating: data[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

exports.getSellerRatings = async (req, res) => {
    const { sellerId } = req.params;
    try {
        const { data, error } = await supabase
            .from('ratings')
            .select('rating, comment, created_at, buyer:users(full_name)')
            .eq('seller_id', sellerId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        const avgRating = data.length ? (data.reduce((sum, r) => sum + r.rating, 0) / data.length).toFixed(1) : 0;
        res.json({ sellerId, averageRating: avgRating, totalRatings: data.length, ratings: data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};