---
layout: docs
permalink: /socket
title: Socket
---

## Data format

| Field | Type   | Description                                       |
|-------|--------|---------------------------------------------------|
| op    | int    | Opcode                                            |
| d     | any    | Data for this payload                             |
| e     | string | Event name, only present with dispatch opcode (0) |

## Connection flow

When you'll try to connect to Union socket, the server will immediately respond with an opcode 1.<br>
After this op, you must authenticate using Basic auth token or your Bot token (*coming soon*):
`{ "op": 2, "d": "Your token goes here" }`

If your authentication token is valid, you'll receive a Hello payload with all servers the user
is in. See `data objects` to see how your payload will look like<br>
If invalid or not done within 30 seconds, connection will be closed with 4001 code

Just after your initial connection, you'll receive `ping` requests from the server. You MUST respond
to them or your connection will be closed with status `4005`

## Subscriptions

Subscriptions are the best way to prevent useless bandwidth and CPU usage.<br>
By default, you're subscribed to all events if you're using a **user** account, and nothing
if you're using a **bot** account. This is because a user will most likely be used in the
Union GUI app and bots in CLI

To subscribe (or unsubscribe), just send this payload to the server: `{ "op": 4, "d": ["events", "here"]}`
(An empty array will be interpreted as (un)subscribe to all)<br>
You'll immediately receive an OK payload and start/stop receiving events

If you send 4 events and one of them is invalid, you'll not be (un)subscribed to anything

## Opcodes

| Code | Name            | Action      | Description                                                     |
|------|-----------------|-------------|-----------------------------------------------------------------|
| -1   | OK              | receive     | Sent to notify the request have been processed                  |
| 0    | Dispatch Event  | receive     | Dispatches an event you're subscribed to                        |
| 1    | Welcome         | receive     | Sent when you're connected to the socket (see connection flow)  |
| 2    | Authenticate    | send        | Your papers, please (see connection flow)                       |
| 3    | Hello           | receive     | Sent when you're logged in, with all server the user is in      |
| 4    | Subscribe       | send        | Used to subscribe to specific topics (see socket subscription)  |
| 5    | Unsubscribe     | send        | See socket subscription                                         |
| 6    | Request Members | send        | *Not implemented*                                               |

## Close codes

| Code | Description            | Troubleshooting                                                  |
|------|------------------------|------------------------------------------------------------------|
| 4001 | Authentication failure | You passed an invalid token (or nothing)                         |
| 4002 | Malformed Payload      | wtf is `{op": 4", "d": {"["client1", client2"]}}`???             |
| 4003 | Unknown op code        | You sent something that you shouldn't                            |
| 4004 | Session invalidated    | User password or MFA settings updated / Bot token reset          |
| 4005 | Session timed out      | Not responding to ping requests                                  |
| 4006 | No active subscription | You can't be not subscribed to anything for more than 30 seconds |

## Events

| Name                  | Description                                             |
|-----------------------|---------------------------------------------------------|
| USER_UPDATE           | When an user is updated                                 |
| PRESENCE_UPDATE       | When an user presence is updated                        |
| SERVER_CREATE         | When a server is joined by the user                     |
| SERVER_UPDATE         | When a server is updated                                |
| SERVER_DELETE         | When a server is deleted (kicked, banned or deleted)    |
| SERVER_MEMBER_JOIN    | When an user joins the server                           |
| SERVER_MEMBER_LEAVE   | When an user leaves the server (self, kicked or banned) |
| SERVER_MEMBERS_CHUNK  | *Not implemented*                                       |
| MESSAGE_CREATE        | When a member posts a message                           |
| MESSAGE_UPDATE        | When a message is updated                               |
| MESSAGE_DELETE        | When a message is deleted                               |

## Data objects

It's better when you know what the socket will send without just trying, right?

### Objects

#### Server

| Field     | Type         | Description                                       |
|-----------|--------------|---------------------------------------------------|
| id        | int          | Server ID                                         |
| name      | string       | Server name                                       |
| owner     | snowflake    | Owner ID                                          |
| iconUrl   | string?      | Url of the server icon, null if no icon           |
| members   | member[]     | List of members in the server                     |
| messages  | message[]    | *Not implemented*                                 |

#### User

| Field         | Type         | Description                                                        |
|---------------|--------------|--------------------------------------------------------------------|
| id            | snowflake    | User ID                                                            |
| username      | string       | Username                                                           |
| discriminator | int          | User discriminator, used to create the user tag (username#discrim) |
| online        | boolean      | If the user is online or not                                       |

#### Presence

| Field         | Type         | Description                    |
|---------------|--------------|--------------------------------|
| id            | snowflake    | User ID                        |
| status        | boolean      | If the user is online or not   |

#### Message

| Field         | Type          | Description                                               |
|---------------|---------------|-----------------------------------------------------------|
| id            | string        | Message ID                                                |
| server        | int           | Server ID                                                 |
| content       | string        | Message contents (**NOT** parsed and **NOT html safe**)   |
| author        | snowflake     | Author ID                                                 |
| createdAt     | ISO8601 date  | When the message was posted                               |
| editedAt      | ISO8601 date? | Last time the message was edited (absent if never edited) |

### Payloads

Payloads contents are really obvious, like for a create event you get an instance of the created object,
a partial when the object is edited and just the ID when the object is deleted

SERVER_MEMBER_JOIN will have a complete user object, and SERVER_MEMBER_LEAVE will only have the user ID 
