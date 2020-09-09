const discord = require("discord.js");
const { config } = require("../../index.js");

module.exports.execute = async (client, message, args) => {

    const helpCommand = client.commands.get("help").help;
    const embed = new discord.MessageEmbed()
        .setColor(client.color)
        .setThumbnail(client.user.avatarURL(client.user))
        .setFooter(`Requested by ${message.author.tag}`)
        .setTimestamp();

    if (!args[0]) {

        const categories = [...new Set(client.commands.map(command => command.help.category))];
    
        embed.setTitle(`*Help Commands ${client.user.username}Bot*`)
        embed.setDescription(
            `*Hi, I'm ${client.user.username}Bot! Below, you'll see a basic list of my commands.
If you need more details for a command, use \`${client.config.prefix}${helpCommand.name} ${helpCommand.usage}\`.
Music servers are expensive! But you can help out [donation here.](https://paypal.me/Shikashi)
If you need further help, join my __[support server!](https://discord.gg/heNgtR2)__*`
        );
    
        embed.addField(
          `*Music*`,
          client.commands
            .filter(c => c.help.category === "Music")
            .map(m => `*\`${m.help.name}\`*`)
            .join(" ")
        )
        message.channel.send(embed);
        return;
    }

    const command = client.commands.get(args[0]) || client.commands.get(client.aliases.get(args[0]));
    if (!command) return this.execute(client, message, []);

    const commandInfo = command.help;
    const aliasesPresent = commandInfo.aliases.length > 0;
    
    embed.setTitle(`${commandInfo.name.toUpperCase()} COMMAND`);
    embed.setDescription(commandInfo.description);
    embed.addField("Usage", `\`${config.prefix}${commandInfo.name}${commandInfo.usage != "" ? ` ${commandInfo.usage}` : ""}\``);
    embed.addField("Aliases", `${aliasesPresent ? commandInfo.aliases.map(alias => `\`${alias}\``).join(", ") : "\`None\`"}`);

    message.channel.send(embed);

}

module.exports.help = {
    name: "help",
    aliases: [],
    category: "Miscellaneous",
    usage: "[command]",
    description: "Need some help with commands because they are too complicated? Look no further! I am here to your aid!"
}