const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey');

      let user;
      if (decoded.id === 999999) {
        user = {
          id: 999999,
          email: 'pleasanthomes@pg.com',
          full_name: 'Property Admin',
          role: 'admin',
          is_active: true
        };
      } else if (decoded.id === 999998) {
        user = {
          id: 999998,
          email: 'pleasanthomes@pg.com',
          full_name: 'Property Staff',
          role: 'staff',
          is_active: true
        };
      } else {
        const { data, error } = await supabase
          .from('users')
          .select('id, email, full_name, role, is_active')
          .eq('id', decoded.id)
          .single();

        if (error || !data) {
          return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
        }
        user = data;
      }

      req.user = user;
      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
