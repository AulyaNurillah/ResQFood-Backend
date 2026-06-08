const supabase = require('../config/supabase');

// Helper: hitung jarak (Haversine formula) dalam kilometer
const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371; // radius bumi dalam km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// GET /api/sellers/nearby?lat=...&lng=...&radius=...
exports.getNearbySellers = async (req, res) => {
    const { lat, lng, radius = 10 } = req.query;
    if (!lat || !lng) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    try {
        // Ambil semua seller_profiles yang memiliki koordinat (dari tabel users)
        const { data: sellers, error } = await supabase
            .from('seller_profiles')
            .select(`
        id,
        store_name,
        store_address,
        store_phone,
        store_description,
        users!inner (
          id,
          full_name,
          email,
          avatar_url,
          latitude,
          longitude
        )
      `)
            .not('users.latitude', 'is', null)
            .not('users.longitude', 'is', null);

        if (error) throw error;

        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        const radiusNum = parseFloat(radius);

        const sellersWithDistance = sellers
            .map(seller => {
                const distance = haversineDistance(
                    latNum, lngNum,
                    seller.users.latitude,
                    seller.users.longitude
                );
                return { ...seller, distance };
            })
            .filter(s => s.distance <= radiusNum)
            .sort((a, b) => a.distance - b.distance);

        res.json(sellersWithDistance);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// GET /api/sellers/:sellerId
exports.getSellerDetail = async (req, res) => {
    const { sellerId } = req.params;
    try {
        const { data: seller, error } = await supabase
            .from('seller_profiles')
            .select(`
        *,
        users:user_id (
          id,
          full_name,
          email,
          phone,
          avatar_url,
          address,
          latitude,
          longitude
        )
      `)
            .eq('id', sellerId)
            .single();

        if (error || !seller) {
            return res.status(404).json({ error: 'Seller not found' });
        }

        // Hitung rata-rata rating dari tabel ratings (berdasarkan seller_id = user_id)
        const { data: ratings, error: ratingErr } = await supabase
            .from('ratings')
            .select('rating')
            .eq('seller_id', seller.user_id);
        if (ratingErr) throw ratingErr;

        const totalRatings = ratings?.length || 0;
        const averageRating = totalRatings > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
            : 0;

        res.json({
            ...seller,
            averageRating,
            totalRatings
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};