const Discord = require("discord.js")

module.exports = {
  name: "pix",
  description: "presente",
  type: Discord.ApplicationCommandType.ChatInput,

  run: async (client, interaction) => {

    if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)) {
        interaction.reply({ content: `Você não possui permissão para utilzar este comando!`, ephemeral: true })
    } else {
        let embed = new Discord.EmbedBuilder()
        .setTitle("Olá amigo!")
        .setColor(0x030303)
        .setDescription("Para agilizar o seu atendimento por favor nos forneças informações abaixo\n\n**Nick:**\n**Presente que deseja:**\n\n**Chave PIX**: servicesraccoon@gmail.com\nPor favor nos envie o comprovante e aguarde o atendimento.")


        interaction.reply({ content: `✅ Mensagem enviada!`, ephemeral: true })
        interaction.channel.send({ embeds: [embed]})
    }
  },
}
