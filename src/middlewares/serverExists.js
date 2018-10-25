import { serverExists } from '../database'

/**
 * Ensures a server matching 'serverId' exists
 */
export default async function (req, res, next) {
  const { serverId } = req.params
  const sid = Number(serverId)

  if (!await serverExists(sid)) {
    return res.status(404).json({
      status: 404,
      error: 'This server does not exists'
    })
  }

  req.serverId = sid
  next()
}
