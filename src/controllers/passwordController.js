const supabase = require('../config/supabase');

// Kirim link reset password ke email
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password`;
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: redirectUrl,
        });
        if (error) throw error;
        res.json({ message: 'Password reset link sent to your email' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Reset password dengan token dari email
exports.resetPassword = async (req, res) => {
    const { access_token, new_password } = req.body;
    if (!access_token || !new_password) {
        return res.status(400).json({ error: 'Access token and new password required' });
    }

    try {
        // Set session menggunakan token dari URL redirect
        const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token: '',
        });
        if (sessionError) throw sessionError;

        // Update password
        const { error: updateError } = await supabase.auth.updateUser({
            password: new_password,
        });
        if (updateError) throw updateError;

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};