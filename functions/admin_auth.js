const jwt = require('jsonwebtoken');

async function admin_auth(req, res) {
  const token = req.body.admin_token;
  try {
    const decoded = await jwt.verify(token, process.env.ADMIN_JWT);
    return { verified: true, decoded: decoded };
  } catch (err) {
    return { verified: false, er: err , token: token };
  }
}

module.exports = admin_auth;
