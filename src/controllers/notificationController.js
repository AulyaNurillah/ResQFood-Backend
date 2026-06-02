const supabase = require('../config/supabase');

exports.getNotifications = async (req, res) => {
    const userId = req.user.id;
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

exports.markAsRead = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {
        const { data: notif } = await supabase.from('notifications').select('user_id').eq('id', id).single();
        if (!notif) return res.status(404).json({ error: 'Notification not found' });
        if (notif.user_id !== userId) return res.status(403).json({ error: 'Not your notification' });
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to mark as read' });
    }
};