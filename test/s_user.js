/* eslint-env node, mocha */
import './_hooks'

describe('User Socket', function () {
  it('should close socket if password is changed')

  describe('PRESENCE_UPDATE', function () {
    it('should dispatch when a user connects to the socket')
    it('should not dispatch if no servers are shared between users')
    it('should dispatch only once if multiple servers are shared between users')
  })

  describe('USER_UPDATE', function () {
    it('should dispatch when a user is updated')
    it('should not dispatch if no servers are shared between users')
    it('should not dispatch if no updates are performed')
    it('should dispatch only once if multiple servers are shared between users')
  })
})
