const Discord = require("discord.js")

module.exports = {
  name: "painel",
  description: "Painel de Compra",
  type: Discord.ApplicationCommandType.ChatInput,

  run: async (client, interaction) => {

    if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)) {
        interaction.reply({ content: `Você não possui permissão para utilzar este comando!`, ephemeral: true })
    } else {
        let embed = new Discord.EmbedBuilder()
        .setTitle("Sistemas de compra")
        .setColor(0x030303)
        .setDescription("Escolha o que deseja comprar clicando nos botões abaixo.")

        const button = new Discord.ActionRowBuilder().addComponents(
            new Discord.ButtonBuilder()
            .setCustomId("smurf")
            .setLabel("Smurf")
            .setEmoji("🎟️")
            .setStyle(Discord.ButtonStyle.Primary),

            new Discord.ButtonBuilder()
            .setCustomId("nfa")
            .setLabel("NFA")
            .setEmoji("🎁")
            .setStyle(Discord.ButtonStyle.Primary),
        );

        interaction.reply({ content: `✅ Mensagem enviada!`, ephemeral: true })
        interaction.channel.send({ embeds: [embed], components: [button] })
    }
  },
}
