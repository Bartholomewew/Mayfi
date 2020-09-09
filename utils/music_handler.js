module.exports.MusicHandler = class MusicHandler {
  constructor(discord, util) {
    this.discord = discord;
    this.util = util;
    this.embed = new discord.MessageEmbed();
  }

  async handleVideo(video, message, voice_channel, ytdl, playlist = false) {
    let ServerQueue = this.client.queue.get(message.guild.id);

    if (!ServerQueue) {
      let queueConstruct = {
        textChannel: message.channel,
        voiceChannel: voice_channel,
        connection: null,
        videos: [],
        volume: 50,
        playing: true,
        loop: false,
        stopped: false,
        userCountSkip: false
      };

      this.client.queue.set(message.guild.id, queueConstruct);
      queueConstruct.videos.push(video);

      voice_channel
        .join()
        .then(connection => {
          queueConstruct.connection = connection;
          connection.sendVoiceStateUpdate({ self_deaf: true });
          this.playVideo(message.guild, queueConstruct.videos[0], ytdl);
        })
        .catch(err => this.client.queue.delete(message.guild.id));
    } else {
      ServerQueue.videos.push(video);
      if (playlist) return;

      const addedVideoIndex = ServerQueue.videos.indexOf(video);
      this.embed
        .setColor("RANDOM")
        .setTitle("Added Video to Queue")
        .setDescription(`\`\`\`${video.title}\`\`\``)
        .setThumbnail(video.thumbnail)
        .addField(
          "Position:",
          `${addedVideoIndex == 1 ? "Up Next" : addedVideoIndex + 1}`,
          true
        )
        .addField("Requested By:", video.requestedBy.user.tag, true)
        .setTimestamp();

      message.channel.send(this.embed);
      return this.embed.spliceFields(0, this.embed.fields.length);
    }

    return;
  }

  async playVideo(guild, video, ytdl) {
    let ServerQueue = this.client.queue.get(guild.id);

    if (!video) {
      ServerQueue.voiceChannel.leave();
      this.client.queue.delete(guild.id);
      return ServerQueue.textChannel.send(`🎵 Music playback has ended.`);
    }

    const dispatcher = ServerQueue.connection.play(
      await ytdl(video.url, {
        quality: "lowest"
      }).catch(err => console.error(err)),
      {
        type: "opus",
        bitrate: 150
      }
    );

    dispatcher.on("finish", () => {
      const currentVideo = ServerQueue.videos[0];

      // If there is no current video means stop command was run or issues with playback occurred
      if (currentVideo) {
        if (ServerQueue.videos.length > 0) {
          if (!currentVideo.loop && !ServerQueue.loop)
            ServerQueue.videos.shift();
          if (!currentVideo.loop && ServerQueue.loop)
            ServerQueue.videos.push(ServerQueue.videos.shift());
        }
      }

      setTimeout(() => {
        this.playVideo(guild, ServerQueue.videos[0], ytdl);
      }, 250);
    });

    dispatcher.on("error", err => console.error(err));

    dispatcher.setVolumeLogarithmic(ServerQueue.volume / 100);

    this.embed
      .setColor("RANDOM")
      .setTitle("Now Playing:")
      .setDescription(`[${video.title}](${video.url})`)
      .setThumbnail(video.thumbnail)
      .addField(
        "Duration:",
        `${this.util.formatSeconds(video.lengthSeconds)}`,
        true
      )
      .addField("Requested By:", video.requestedBy.user.tag, true)
      .setTimestamp();

    ServerQueue.textChannel.send(this.embed);
    this.embed.spliceFields(0, this.embed.fields.length);
  }

  async getVideoInfo(url, ytdl, message) {
    return ytdl.getInfo(url, async (err, info) => {
      if (err) return;

      const videoDetails = info.player_response.videoDetails;
      const {
        videoId,
        title,
        thumbnail,
        lengthSeconds,
        author,
        channelId
      } = videoDetails;
      const thumbnail_array_length = thumbnail.thumbnails.length;

      let videoInfo = {
        url: `https://www.youtube.com/watch?v=${videoId}`,
        title: title,
        thumbnail: thumbnail.thumbnails[thumbnail_array_length - 1].url,
        lengthSeconds: lengthSeconds,
        author: author,
        authorUrl: `https://www.youtube.com/channel/${channelId}`,
        requestedBy: message.member,
        votes: { users: [], num: 0 },
        loop: false
      };

      return videoInfo;
    });
  }

  async getGuildQueue(guildID) {
    return this.ServerQueue.get(guildID);
  }
};
