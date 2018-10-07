import config from '../../../Configuration'
import { createUser } from '../../DatabaseHandler'

export async function create (req, res) {
  const { username, password } = req.body

  if (!username || username.trim().length === 0) {
    return res.status(400).json({ 'error': 'Username cannot be empty.' })
  }

  if (username.trim().length > config.rules.usernameCharacterLimit) {
    return res.status(400).json({ 'error': `Username cannot exceed ${config.rules.usernameCharacterLimit} characters.` })
  }

  if (!password || password.length < 5) {
    return res.status(400).json({ 'error': 'Password cannot be empty and must be 5 characters long or more.' })
  }

  const created = await createUser(username.trim(), password)

  if (created) {
    return res.status(200).send('Account created! You may now login.') // todo: json
  } else {
    return res.status(200).send('Unable to create account (it may already exist!)') // also json here
  }
}
