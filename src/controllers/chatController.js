const supabase = require('../config/supabase');

// Send message
exports.sendMessage = async (req, res) => {
    const { orderId, message } = req.body;
    const senderId = req.user.id;
    try {
        // Get order to find receiver
        const { data: order, error: orderErr } = await supabase
            .from('orders')
            .select('buyer_id, seller_id')
            .eq('id', orderId)
            .single();
        if (orderErr || !order) return res.status(404).json({ error: 'Order not found' });
        const receiverId = (order.buyer_id === senderId) ? order.seller_id : order.buyer_id;
        const { data, error } = await supabase
            .from('messages')
            .insert([{
                order_id: orderId,
                sender_id: senderId,
                receiver_id: receiverId,
                message,
                is_read: false
            }])
            .select();
        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to send message' });
    }
};

// Get messages by order
exports.getMessages = async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user.id;
    try {
        // Verify user is part of order
        const { data: order } = await supabase
            .from('orders')
            .select('buyer_id, seller_id')
            .eq('id', orderId)
            .single();
        if (!order || (order.buyer_id !== userId && order.seller_id !== userId)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('order_id', orderId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
};

// Mark message as read
exports.markMessageAsRead = async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user.id;
    try {
        const { data: msg } = await supabase.from('messages').select('receiver_id').eq('id', messageId).single();
        if (!msg) return res.status(404).json({ error: 'Message not found' });
        if (msg.receiver_id !== userId) return res.status(403).json({ error: 'Not your message' });
        const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('id', messageId);
        if (error) throw error;
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to mark as read' });
    }
};

// Delete message (only sender or receiver)
exports.deleteMessage = async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user.id;
    try {
        const { data: msg } = await supabase
            .from('messages')
            .select('sender_id, receiver_id')
            .eq('id', messageId)
            .single();
        if (!msg) return res.status(404).json({ error: 'Message not found' });
        if (msg.sender_id !== userId && msg.receiver_id !== userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        await supabase.from('messages').delete().eq('id', messageId);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete message' });
    }
};