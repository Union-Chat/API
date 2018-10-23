/* eslint-env node, mocha */
import './_hooks'

describe('Server Socket', function () {
  describe('SERVER_CREATE', function () {
    it('should dispatch when a server is created')
    it('should not dispatch if the user is not the owner')
  })

  describe('SERVER_UPDATE', function () {
    it('should dispatch when a server is updated')
    it('should not dispatch if the user is not in the server')
    it('should not dispatch if no updates are performed')
  })

  describe('SERVER_DELETE', function () {
    it('should dispatch when a server is deleted')
    it('should dispatch when the user leaves the server')
    it('should not dispatch if the user is not in the server')
  })

  describe('SERVER_MEMBER_JOIN', function () {
    it('should dispatch when a member joins the server')
    it('should not be dispatched to the concerned user')
    it('should not dispatch if the user is not in the server')
  })

  describe('SERVER_MEMBER_LEAVE', function () {
    it('should dispatch when a member leaves the server')
    it('should not be dispatched to the concerned user')
    it('should not dispatch if the user is not in the server')
  })
})
