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