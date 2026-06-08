const supabase = require('../config/supabase');

// Membuat rating untuk order yang sudah selesai
exports.createRating = async (req, res) => {
    const { orderId, rating, review } = req.body;
    const buyerId = req.user.id;

    if (!orderId || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Order ID and valid rating (1-5) required' });
    }

    try {
        // Cek apakah order milik buyer dan sudah selesai
        const { data: order, error: orderErr } = await supabase
            .from('orders')
            .select('seller_id, status')
            .eq('id', orderId)
            .eq('buyer_id', buyerId)
            .single();
        if (orderErr || !order) return res.status(404).json({ error: 'Order not found' });
        if (order.status !== 'selesai') {
            return res.status(400).json({ error: 'Order belum selesai, belum bisa rating' });
        }

        // Cek apakah sudah pernah rating
        const { data: existing } = await supabase
            .from('ratings')
            .select('id')
            .eq('order_id', orderId)
            .single();
        if (existing) {
            return res.status(400).json({ error: 'Sudah memberi rating untuk order ini' });
        }

        const { data, error } = await supabase
            .from('ratings')
            .insert([{
                order_id: orderId,
                buyer_id: buyerId,
                seller_id: order.seller_id,
                rating,
                review
            }])
            .select();
        if (error) throw error;

        res.status(201).json({ message: 'Rating berhasil', rating: data[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Mendapatkan rating rata-rata penjual
exports.getSellerRatings = async (req, res) => {
    const { sellerId } = req.params;
    try {
        const { data, error } = await supabase
            .from('ratings')
            .select('rating, review, created_at, buyer:users(full_name)')
            .eq('seller_id', sellerId)
            .order('created_at', { ascending: false });
        if (error) throw error;

        const average = data.length > 0
            ? data.reduce((sum, r) => sum + r.rating, 0) / data.length
            : 0;

        res.json({ sellerId, averageRating: average, totalRatings: data.length, ratings: data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};