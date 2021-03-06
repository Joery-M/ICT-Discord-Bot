const Discord = require("discord.js");
const mc = require("minecraft-server-util");
const fs = require("fs");

module.exports = {
	name: "mc",
	aliases: ["fuckmc", "banmc", "removemc"],
	description: "",
	category: "Misc",
	guildOnly: false,
	memberpermissions: "",
	adminPermOverride: true,
	cooldown: 0,
	args: [],
	usage: "&pref;mc (optional: server IP)",
	/**
	 * @param {Discord.Client} client
	 * @param {Discord.Message} msg
	 * @param {Array} args
	 * @param {String} curPrefix
	 */
	async execute (client, msg, args, curPrefix)
	{
		if (fs.existsSync("./misc/botConfig.json"))
		{
			var botConfig = require("../misc/botConfig.json");
		} else
		{
			var botConfig = {};
			fs.writeFileSync("./misc/botConfig.json", JSON.stringify(botConfig));
		}
		if (args[0] == "set" && msg.member.permissions.has("ADMINISTRATOR"))
		{
			var newIP = args[1];
			botConfig.McServer = newIP;
			msg.channel.send("Default server IP is now: `" + newIP + "`");
			fs.writeFileSync("./misc/botConfig.json", JSON.stringify(botConfig));
			return;
		}

		if (!botConfig.McServer && !args[0])
		{
			var server = "vizuhfy.minehut.gg";
			botConfig.McServer = "vizuhfy.minehut.gg";
			fs.writeFileSync("./misc/botConfig.json", JSON.stringify(botConfig));
		} else if (!args[0])
		{
			var server = botConfig.McServer;
		} else
		{
			var server = args[0];
		}
		msg.channel.sendTyping();
		if (server.split(":")[1])
		{
			var opts = parseFloat(server.split(":")[1]);
			server = server.split(":")[0];
		} else
		{
			var opts = 25565;
		}
		mc.status(server, opts)
			.then((data) =>
			{
				if (data.favicon)
				{
					var dataUri = data.favicon.replace(/^data:image\/png;base64,/, "");
					fs.writeFileSync("./mcFavicon.png", dataUri, "base64");
					var file = new Discord.MessageAttachment("./mcFavicon.png");
				}
				if (data.motd.clean.toLowerCase().includes("offline"))
				{
					var color = "#ff0000";
				} else
				{
					var color = "#0099ff";
				}
				const embed = new Discord.MessageEmbed()
					.setColor(color)
					.setTitle("Minecraft server: " + server)
					.addFields([
						{ name: "Description", value: "```" + data.motd.clean + "```", inline: false },
						{ name: "Ping", value: parseFloat(data.roundTripLatency) / 2 + "ms", inline: true },
						{ name: "Players", value: `${data.players.online}/${data.players.max}`, inline: true },
					]);

				if (data.players.sample)
				{
					var playerList = []
					data.players.sample.forEach((player)=>{
						playerList.push(player.name)
					})
					embed.addField("Online players", playerList.join(", "))
				}
				if (data.version)
				{
					embed.addField("Game version", data.version.name)
				}
				if (data.favicon)
				{
					embed.setThumbnail("attachment://mcFavicon.png");
					msg.channel.send({ embeds: [embed], files: [file] }).then(() =>
					{
						fs.rmSync("./mcFavicon.png");
					});
				} else
				{
					msg.channel.send({ embeds: [embed] });
				}
			})
			.catch((reason) =>
			{
				if (reason.toString().split("\n")[0].startsWith("Error: getaddrinfo ENOTFOUND "))
				{
					return msg.channel.send("I couldn't find that server: `" + server.toLowerCase() + "`");
				}
				console.log(reason);
				msg.channel.send(reason.toString().split("\n")[0]);
			});
	},
};
