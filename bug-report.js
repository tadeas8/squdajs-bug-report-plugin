// squad-server/plugins/bug-report.js
// Simple bug report plugin.
// Command: !bug <text> or !bugs <text>  -> sends an embed to a Discord channel with player + map + layer + description.

import DiscordBasePlugin from './discord-base-plugin.js';

export default class BugReport extends DiscordBasePlugin {
  static get description() {
    return 'Allows players to report bugs via !bug <text>, which are then sent to a Discord channel as embeds.';
  }

  static get defaultEnabled() {
    return false;
  }

  static get optionsSpecification() {
    return {
      ...DiscordBasePlugin.optionsSpecification,
      brandTag: {
        required: false,
        description: 'Tag prefix for in-game messages.',
        default: '[BUG]'
      },
      channelID: {
        required: true,
        description: 'Discord channel ID for bug reports.',
        default: '',
        example: '667741905228136459'
      },
      cooldownSeconds: {
        required: false,
        description: 'Cooldown per player between bug reports (to prevent spam).',
        default: 60
      }
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.brandTag = this.options.brandTag || '[BUG]';
    this.cooldownSeconds = this.options.cooldownSeconds || 60;

    this.lastReportTimeByPlayer = new Map(); // key: steamID/eosID -> timestamp ms

    this.onChatMessage = this.onChatMessage.bind(this);
  }

  async mount() {
    this.server.on('CHAT_MESSAGE', this.onChatMessage);
    this.verbose(1, 'BugReport mounted.');
  }

  async unmount() {
    this.server.removeListener('CHAT_MESSAGE', this.onChatMessage);
    this.verbose(1, 'BugReport unmounted.');
  }

  formatMessage(msg) {
    return `${this.brandTag} ${msg}`;
  }

  async onChatMessage(data) {
    try {
      const raw = (data.message || '').trim();
      const lower = raw.toLowerCase();
      
      // Check if message starts with !bug or !bugs
      if (!lower.startsWith('!bug')) return;

      const player = data.player;

      // Extract text after "!bug" or "!bugs" using regex
      // This handles both !bug and !bugs correctly
      const match = raw.match(/^!bugs?\s+(.+)$/i);
      if (!match || !match[1]) {
        await this.server.rcon.warn(
          player.eosID,
          this.formatMessage('Usage: !bug <short description of the issue>.')
        );
        return;
      }
      
      let text = match[1].trim();

      // Cooldown per player
      const now = Date.now();
      const key = player.steamID || player.eosID || player.name;
      const last = this.lastReportTimeByPlayer.get(key) || 0;
      const diffSec = (now - last) / 1000;

      if (diffSec < this.cooldownSeconds) {
        const wait = Math.ceil(this.cooldownSeconds - diffSec);
        await this.server.rcon.warn(
          player.eosID,
          this.formatMessage(`Please wait ${wait}s before sending another bug report.`)
        );
        return;
      }

      this.lastReportTimeByPlayer.set(key, now);

      // Limit length, aby se embed nezabil
      if (text.length > 500) {
        text = text.slice(0, 500) + '…';
      }

      // Fetch map + layer from RCON (best-effort)
      let mapName = 'Unknown map';
      let layerName = 'Unknown layer';
      try {
        const mapInfo = await this.server.rcon.getCurrentMap();
        if (mapInfo) {
          mapName = mapInfo.level || mapInfo.map || mapName;
          layerName = mapInfo.layer || layerName;
        }
      } catch (err) {
        this.verbose(1, `getCurrentMap error: ${err.message}`);
        this.verbose(2, err.stack);
      }

      // Send to Discord
      await this.sendDiscordBugReport(player, mapName, layerName, text);

      // Ack to player
      await this.server.rcon.warn(
        player.eosID,
        this.formatMessage('Thanks! Your bug report has been sent to the admins.')
      );

      this.verbose(1, `Report from ${player.name} on ${mapName} / ${layerName}: ${text}`);
    } catch (err) {
      this.verbose(1, `Error in onChatMessage: ${err.message}`);
      this.verbose(2, err.stack);
    }
  }

  async sendDiscordBugReport(player, mapName, layerName, text) {
    try {
      if (!this.options.channelID) {
        this.verbose(1, 'Discord channelID not configured.');
        return;
      }

      const now = new Date();

      await this.sendDiscordMessage({
        embed: {
          title: 'New bug report',
          description: text,
          color: 16761867, // Orange/red color similar to other plugins
          fields: [
            {
              name: 'Player',
              value: `${player.name} (${player.steamID || player.eosID || 'unknown ID'})`,
              inline: true
            },
            {
              name: 'SteamID',
              value: player.steamID 
                ? `[${player.steamID}](https://steamcommunity.com/profiles/${player.steamID})`
                : 'N/A',
              inline: true
            },
            {
              name: 'EOSID',
              value: player.eosID || 'N/A',
              inline: true
            },
            {
              name: 'Map / Layer',
              value: `${mapName}\n${layerName}`
            }
          ],
          timestamp: now.toISOString()
        }
      });

      this.verbose(1, `Bug report sent to Discord channel ${this.options.channelID}`);
    } catch (err) {
      this.verbose(1, `Error sending Discord bug report: ${err.message}`);
      this.verbose(2, err.stack);
    }
  }
}