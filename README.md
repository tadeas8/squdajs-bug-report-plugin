# Bug Report Plugin

A SquadJS plugin that allows players to report bugs directly from in-game chat. Bug reports are automatically sent to a Discord channel with detailed information including player details, map, layer, and the bug description.

## Description

The Bug Report plugin enables players to submit bug reports using the `!bug` or `!bugs` command in-game. Each report is automatically formatted as a Discord embed and sent to a designated channel, providing administrators with all the necessary context to investigate issues.

## Features

- **In-Game Command**: Players can report bugs using `!bug <description>` or `!bugs <description>`
- **Discord Integration**: Reports are automatically sent to a Discord channel as rich embeds
- **Automatic Context**: Includes player information, SteamID, EOSID, current map, and layer
- **Spam Protection**: Configurable cooldown system prevents abuse
- **Character Limit**: Automatically truncates reports longer than 500 characters
- **Player Feedback**: Confirms to players when their report has been submitted

## Installation

1. Copy `bug-report.js` to your SquadJS `plugins` directory
2. Ensure you have a Discord connector configured in your SquadJS setup
3. Add the plugin to your server configuration

## Configuration

Add the plugin to your server configuration file:

```json
{
  "plugins": [
    {
      "plugin": "bug-report",
      "enabled": true,
      "discordClient": "discord",
      "channelID": "667741905228136459",
      "brandTag": "[BUG]",
      "cooldownSeconds": 60
    }
  ]
}
```

### Configuration Options

| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `discordClient` | Yes | `"discord"` | The name of your Discord connector |
| `channelID` | Yes | - | Discord channel ID where bug reports will be sent |
| `brandTag` | No | `"[BUG]"` | Prefix tag for in-game messages |
| `cooldownSeconds` | No | `60` | Cooldown time (in seconds) between bug reports per player |

## Usage

### For Players

Players can report bugs by typing in the in-game chat:

```
!bug <description of the issue>
```

or

```
!bugs <description of the issue>
```

**Example:**
```
!bug Vehicle spawn timer not working on Al Basrah
```

### For Administrators

Bug reports appear in the configured Discord channel as embeds containing:

- **Title**: "New bug report"
- **Description**: The bug report text (up to 500 characters)
- **Player Information**: Player name, SteamID (with clickable link), and EOSID
- **Map / Layer**: Current map and layer when the report was submitted
- **Timestamp**: When the report was submitted

## Requirements

- SquadJS server instance
- Discord connector configured and connected
- Discord bot with permissions to send messages in the target channel

## Notes

- Reports are limited to 500 characters and will be automatically truncated
- Each player has a cooldown period between reports (default: 60 seconds)
- The plugin attempts to fetch the current map and layer, but will show "Unknown" if unavailable
- SteamID links are automatically generated and clickable in Discord

## Default Status

This plugin is **disabled by default**. You must explicitly enable it in your configuration.
