import config from '../../Configuration'

import fetch from 'node-fetch'
import { createUser, deleteUser, updateUser } from '../DatabaseHandler'
import { compare } from 'bcrypt'

export async function create (req, res) {
  const { username, password } = req.body

  if (config.recaptcha && process.env.NODE_ENV !== 'test') {
    console.log(config.recaptcha)
    const gRecaptchaResponse = req.body['g-recaptcha-response']
    if (!gRecaptchaResponse) {
      return res.status(400).json({ error: 'reCAPTCHA is missing' })
    }

    const response = await (await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        secret: config.recaptcha.secret,
        response: gRecaptchaResponse,
        remoteip: req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress
      })
    })).json()

    if (!response.success) {
      return res.status(400).json({ error: 'reCAPTCHA check failed' })
    }
  }

  // Validate data
  if (!username || username.trim().length === 0) {
    return res.status(400).json({ error: 'Username cannot be empty' })
  }

  if (username.trim().length > config.rules.usernameCharacterLimit) {
    return res.status(400).json({ error: `Username cannot exceed ${config.rules.usernameCharacterLimit} characters` })
  }

  if ([':', '#'].some(char => username.includes(char))) {
    return res.status(400).json({ error: 'Your username contains prohibited characters' })
  }

  if (!password || password.length < 5) {
    return res.status(400).json({ error: 'Password cannot be empty and must be 5 characters long or more' })
  }

  // Save data
  createUser(username.trim(), password)
    .then(id => res.status(200).json({ id }))
    .catch(err => res.status(400).json({ error: err.message }))
}

export async function getSelf (req, res) {
  res.json(Object.assign({}, req.user, { password: undefined }))
}

export async function patch (req, res) {
  const { password, username, newPassword } = req.body
  if (!password || !await compare(password, req.user.password)) {
    return res.sendStatus(401)
  }

  if (username !== undefined) {
    if (username.trim().length === 0) {
      return res.status(400).json({ error: 'Username cannot be empty' })
    }

    if (username.trim().length > config.rules.usernameCharacterLimit) {
      return res.status(400).json({ error: `Username cannot exceed ${config.rules.usernameCharacterLimit} characters` })
    }

    if ([':', '#'].some(char => username.includes(char))) {
      return res.status(400).json({ error: 'Your username contains prohibited characters' })
    }
  }

  if (newPassword !== undefined && newPassword.length < 5) {
    return res.status(400).json({ error: 'Password cannot be empty and must be 5 characters long or more' })
  }

  const newUser = await updateUser(req.user.id, username || req.user.username, newPassword)
  res.status(200).send(newUser)
}

export async function remove (req, res) {
  const { password } = req.body
  if (!password || !await compare(password, req.user.password)) {
    return res.sendStatus(401)
  }

  await deleteUser(req.user.id)
  res.sendStatus(204)
}
