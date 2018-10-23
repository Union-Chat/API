/* eslint-env node, mocha */
import './_hooks'

describe('Core Socket', function () {
  describe('Connection flow', function () {
    it('should send WELCOME, receive AUTHENTICATE and send HELLO')
    it('should close connection if the user does not AUTHENTICATE in 30s')
    it('should close connection if auth token is invalid')
  })

  describe('Subscription flow', function () {
    it('should send back OK')
    it('should not dispatch if not subscribed')
    it('should dispatch if subscribed')
    it('should close connection if not subscribed to anything for too long')
  })

  describe('Connection closing', function () {
    it('should close connection if payload is invalid')
    it('should close connection if opcode is invalid')
    it('should close connection if not responding to ping requests')
  })
})
