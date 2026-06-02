const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    const { email, password, fullName, phone } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }
    try {
        const { data: existing } = await supabase
            .from('users')
            .select('email')
            .eq('email', email)
            .single();
        if (existing) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        const hashed = await bcrypt.hash(password, 10);
        const { data, error } = await supabase
            .from('users')
            .insert([{
                email,
                password_hash: hashed,
                full_name: fullName,
                phone,
                roles: ['pembeli']
            }])
            .select();
        if (error) throw error;
        res.status(201).json({ message: 'User registered', user: data[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
        const token = jwt.sign(
            { id: user.id, email: user.email, roles: user.roles },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.json({ token, user: { id: user.id, email: user.email, roles: user.roles, fullName: user.full_name } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};