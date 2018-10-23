/* eslint-env node, mocha */
import './_hooks'

describe('Message Socket', function () {
  describe('MESSAGE_CREATE', function () {
    it('should dispatch when a message is posted')
    it('should not dispatch if the user is not in the server')
  })

  describe('MESSAGE_UPDATE', function () {
    it('should dispatch when a message is updated')
    it('should not dispatch if the user is not in the server')
    it('should not dispatch if no updates are performed')
  })

  describe('MESSAGE_DELETE', function () {
    it('should dispatch when a message is deleted')
    it('should not dispatch if the user is not in the server')
  })
})
