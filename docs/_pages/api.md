---
layout: docs
permalink: /api
title: Union API
---

# API Standards

Api root: `/api`

Union API uses REST methods, because our server is too lazy and needs to rest. Wait what??

## Versions

| Version      | Status           |
|--------------|------------------|
| v1           | Removed          |
| v2 (default) | Available        |

## Authentication

You can authenticate your requests in 3 ways:
 - Using a Basic token
 - Using an Oauth2 token (*coming soon*)
 - Using your bot token (*coming soon*)

## Rate Limiting

To prevent excessive abuse of our API and overall slowdowns, we use rate limiting on a per-route basis
(with a global rate very high rate limiting)

### Headers

Union API uses standard rate limiting headers:

```
X-RateLimit-Limit: xxxxxx
X-RateLimit-Remaining: xxxxxx
Retry-After: xxxxxx
```

### Rates

| Scope       | Rate                            |
|-------------|---------------------------------|
| Per-route   | 10 req/s                        |
| Global      | 500 req/s, 5min ban if reached* |

*\*Will ban from the API **AND** the socket*

# Endpoints

## Users

### Create an user

<span class='api-endpoint'><span class='sun-flower-text'>POST</span> /users</span>

### Get current user

<span class='api-endpoint'><span class='sun-flower-text'>GET</span> /users/self</span>

### Update the current user

<span class='api-endpoint'><span class='sun-flower-text'>PUT/PATCH</span> /users/self</span>

### Delete the current user

<span class='api-endpoint'><span class='sun-flower-text'>DELETE</span> /users/self</span>

## Servers

### Create a server

<span class='api-endpoint'><span class='sun-flower-text'>POST</span> /servers</span>

### Update a server

<span class='api-endpoint'><span class='sun-flower-text'>PUT/PATCH</span> /servers/:serverId</span>

### Leave a server

<span class='api-endpoint'><span class='sun-flower-text'>DELETE</span> /servers/:serverId/leave</span>

### Delete a server

<span class='api-endpoint'><span class='sun-flower-text'>DELETE</span> /servers/:serverId</span>

### Post a message

<span class='api-endpoint'><span class='sun-flower-text'>POST</span> /servers/:serverId/messages</span>

### Edit a message

<span class='api-endpoint'><span class='sun-flower-text'>PUT/PATCH</span> /servers/:serverId/messages/:messageId</span>

### Delete a message

<span class='api-endpoint'><span class='sun-flower-text'>DELETE</span> /servers/:serverId/messages/:messageId</span>

## Invites

### Create an invite

<span class='api-endpoint'><span class='sun-flower-text'>POST</span> /servers/:serverId/invites</span>

### Accept an invite

<span class='api-endpoint'><span class='sun-flower-text'>POST</span> /invites/:invite</span>
