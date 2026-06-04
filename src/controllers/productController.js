const supabase = require('../config/supabase');

// Get all products (public) with filters
exports.getAllProducts = async (req, res) => {
    const { search, minPrice, maxPrice, status, category } = req.query;
    try {
        let query = supabase
            .from('products')
            .select(`
        *,
        seller:users ( full_name, phone, address, latitude, longitude )
      `);
        if (search) query = query.ilike('name', `%${search}%`);
        if (minPrice) query = query.gte('price', parseInt(minPrice));
        if (maxPrice) query = query.lte('price', parseInt(maxPrice));
        if (status) query = query.eq('status', status);
        if (category) query = query.eq('category', category);
        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};

// Get single product by id
exports.getProductById = async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabase
            .from('products')
            .select(`
        *,
        seller:users ( full_name, phone, address, latitude, longitude )
      `)
            .eq('id', id)
            .single();
        if (error || !data) return res.status(404).json({ error: 'Product not found' });
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
};

// Create product (seller only)
exports.createProduct = async (req, res) => {
    const { name, description, price, stock, imageUrl, pickupStart, pickupEnd, expiredDate, category } = req.body;
    const sellerId = req.user.id;
    try {
        const { data, error } = await supabase
            .from('products')
            .insert([{
                seller_id: sellerId,
                name,
                description,
                price,
                stock,
                image_url: imageUrl,
                pickup_start: pickupStart,
                pickup_end: pickupEnd,
                expired_date: expiredDate,
                category: category || 'lainnya',
                status: 'tersedia'
            }])
            .select();
        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create product' });
    }
};

// Update product
exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, description, price, stock, imageUrl, pickupStart, pickupEnd, expiredDate, status } = req.body;
    const userId = req.user.id;
    try {
        const { data: existing } = await supabase.from('products').select('seller_id').eq('id', id).single();
        if (!existing) return res.status(404).json({ error: 'Product not found' });
        if (existing.seller_id !== userId) return res.status(403).json({ error: 'Not your product' });
        const { data, error } = await supabase
            .from('products')
            .update({ name, description, price, stock, image_url: imageUrl, pickup_start: pickupStart, pickup_end: pickupEnd, expired_date: expiredDate, status })
            .eq('id', id)
            .select();
        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update product' });
    }
};

// Delete product
exports.deleteProduct = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {
        const { data: existing } = await supabase.from('products').select('seller_id').eq('id', id).single();
        if (!existing) return res.status(404).json({ error: 'Product not found' });
        if (existing.seller_id !== userId) return res.status(403).json({ error: 'Not your product' });
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete product' });
    }
};