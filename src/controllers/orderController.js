const supabase = require('../config/supabase');

// Create order (checkout)
exports.createOrder = async (req, res) => {
    const { productId, quantity } = req.body;
    const buyerId = req.user.id;
    try {
        const { data: product, error: prodErr } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();
        if (prodErr || !product) return res.status(404).json({ error: 'Product not found' });
        if (product.stock < quantity) return res.status(400).json({ error: 'Insufficient stock' });
        // Reduce stock
        await supabase.from('products').update({ stock: product.stock - quantity }).eq('id', productId);
        const { data, error } = await supabase
            .from('orders')
            .insert([{
                buyer_id: buyerId,
                seller_id: product.seller_id,
                product_id: product.id,
                quantity,
                total_price: product.price * quantity,
                status: 'menunggu_konfirmasi_penjual'
            }])
            .select();
        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create order' });
    }
};

// Accept order (seller) -> generate QR token
exports.acceptOrder = async (req, res) => {
    const { id } = req.params;
    const sellerId = req.user.id;
    try {
        const { data: order, error: fetchErr } = await supabase
            .from('orders')
            .select('*, product:products(*)')
            .eq('id', orderId)
            .single();
        if (fetchErr || !order) return res.status(404).json({ error: 'Order not found' });
        if (order.seller_id !== sellerId) return res.status(403).json({ error: 'Not your order' });
        if (order.status !== 'menunggu_konfirmasi_penjual') return res.status(400).json({ error: 'Order cannot be accepted' });
        const qrToken = `${order.id}-${Date.now()}`;
        const { data, error } = await supabase
            .from('orders')
            .update({ status: 'diterima_penjual', qr_token: qrToken, updated_at: new Date() })
            .eq('id', orderId)
            .select();
        if (error) throw error;
        // Create notification for buyer
        await supabase.from('notifications').insert([{
            user_id: order.buyer_id,
            title: 'Pesanan Diterima',
            body: `Pesanan untuk ${order.product.name} telah diterima penjual. Silakan lakukan pickup.`
        }]);
        res.json(data[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to accept order' });
    }
};

// Scan QR (seller) -> complete order
exports.scanQr = async (req, res) => {
    const { qrToken } = req.body;
    const sellerId = req.user.id;
    try {
        const { data: order, error } = await supabase
            .from('orders')
            .select('*, product:products(*)')
            .eq('qr_token', qrToken)
            .single();
        if (error || !order) return res.status(404).json({ error: 'Invalid QR token' });
        if (order.seller_id !== sellerId) return res.status(403).json({ error: 'Not your order' });
        if (order.status !== 'diterima_penjual') return res.status(400).json({ error: 'Order cannot be completed' });
        const { data, updErr } = await supabase
            .from('orders')
            .update({ status: 'selesai', updated_at: new Date() })
            .eq('id', order.id)
            .select();
        if (updErr) throw updErr;
        // Notifications for both
        await supabase.from('notifications').insert([
            { user_id: order.buyer_id, title: 'Pesanan Selesai', body: `Pesanan untuk ${order.product.name} telah selesai. Terima kasih!` },
            { user_id: order.seller_id, title: 'Pesanan Selesai', body: `Pesanan untuk ${order.product.name} telah selesai. Terima kasih telah berkontribusi!` }
        ]);
        res.json(data[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to complete order' });
    }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {
        const { data: order, error } = await supabase.from('orders').select('*').eq('id', id).single();
        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (order.buyer_id !== userId && order.seller_id !== userId) return res.status(403).json({ error: 'Unauthorized' });
        if (order.status !== 'menunggu_konfirmasi_penjual' && order.status !== 'diterima_penjual') {
            return res.status(400).json({ error: 'Order cannot be cancelled' });
        }
        // Restore stock
        const { data: product } = await supabase.from('products').select('stock').eq('id', order.product_id).single();
        await supabase.from('products').update({ stock: product.stock + order.quantity }).eq('id', order.product_id);
        const { data, updErr } = await supabase
            .from('orders')
            .update({ status: 'dibatalkan', updated_at: new Date() })
            .eq('id', id)
            .select();
        if (updErr) throw updErr;
        res.json(data[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to cancel order' });
    }
};

// Get my orders (as buyer)
exports.getMyOrders = async (req, res) => {
    const buyerId = req.user.id;
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*, product:products(name), seller:users(full_name)')
            .eq('buyer_id', buyerId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

// Get my sales (as seller)
exports.getMySales = async (req, res) => {
    const sellerId = req.user.id;
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*, product:products(name), buyer:users(full_name)')
            .eq('seller_id', sellerId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch sales' });
    }
};

// Get order by id (with product & user details)
exports.getOrderById = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {
        const { data, error } = await supabase
            .from('orders')
            .select(`
        *,
        product:products(name, price, image_url),
        seller:users(id, full_name, phone, address, latitude, longitude),
        buyer:users(id, full_name, phone)
      `)
            .eq('id', id)
            .single();
        if (error || !data) return res.status(404).json({ error: 'Order not found' });
        if (data.buyer_id !== userId && data.seller_id !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
};