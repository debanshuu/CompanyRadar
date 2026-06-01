const jwt = require('jsonwebtoken');

module.exports = async (req, res, next) => {
  try {
    //Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Access denied. Please log in.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET); //Verify token
    req.user = decoded;
    next();

  } catch (error) {
    res.status(401).json({ error: 'Invalid token. Please log in again.' });
  }
};