export default async function (req, res, next) {
  const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  if (global.bannedIps.includes(ip)) {
    return res.sendStatus(403).send('You are banned from the API');
  }
  next();
}
