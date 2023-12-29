const { Client, GatewayIntentBits, ActionRowBuilder, Events, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const Discord = require("discord.js");
require('dotenv').config()
const fs = require('fs');
const axios = require('axios');
const uuid = require('uuid');
const qrcode = require('qrcode');
const { AttachmentBuilder } = require('discord.js');

const embed = new Discord.EmbedBuilder()
  .setColor(0x030303)
  .setTitle(`Carrinho - Smurf`)
  .setDescription("Escolha se deseja uma skin aleatória ou pesquisar por uma skin.\nEsse carrinho irá fechar em 3 horas.");

const buttons = new Discord.ActionRowBuilder().addComponents(
    new Discord.ButtonBuilder()
    .setCustomId("buyRandom")
    .setLabel("Random")
    .setEmoji("🛍️")
    .setStyle(Discord.ButtonStyle.Primary),
    new Discord.ButtonBuilder()
    .setCustomId("searchSmurf")
    .setLabel("Pesquisar")
    .setEmoji("🔍")
    .setStyle(Discord.ButtonStyle.Primary),
);

module.exports = async function(interaction) {

  const channelName = `🧌﹒smurf﹒${interaction.user.username}`;
  const category = interaction.guild.channels.cache.get(process.env.TICKET) ?? null;
  const existingChannel = interaction.guild.channels.cache.find(c => c.name === channelName);

  if (existingChannel) {
    return interaction.reply({ 
      content: `Você já possui um ticket aberto em ${existingChannel}!`, 
      ephemeral: true 
    });
  }

  const channel = await interaction.guild.channels.create({
    name: channelName,
    type: Discord.ChannelType.GuildText,
    parent: category,
    permissionOverwrites: [
      {
        id: interaction.guild.id,
        deny: [
          Discord.PermissionFlagsBits.ViewChannel
        ]
      },
      {
        id: interaction.user.id,
        allow: [
          Discord.PermissionFlagsBits.ViewChannel,
          Discord.PermissionFlagsBits.SendMessages,
          Discord.PermissionFlagsBits.AttachFiles,
          Discord.PermissionFlagsBits.EmbedLinks,
          Discord.PermissionFlagsBits.AddReactions
        ]
      }
    ]
  });
  
  interaction.reply({ 
    content: `Seu ticket foi aberto no canal: ${channel}!`, 
    ephemeral: true 
  });
    
  const message = await channel.send({ embeds: [embed], components: [buttons] });
  
  const collector = message.createMessageComponentCollector({
    componentType: 2,
    time: 45 * 60 * 1000 * 4
  });

  collector.on('collect', async (interaction) => {

    if (interaction.customId === "searchSmurf") {

      const caminhoDoArquivo = './databases/pagAtivos.json';

      let pagAtivos = [];

      try {
        const dados = fs.readFileSync(caminhoDoArquivo, 'utf8');
        pagAtivos = JSON.parse(dados);
      } catch (erro) {
        console.error('Erro ao carregar os pagamentos:', erro);
      }

      const user_id = interaction.user.id;

      const encontrado = pagAtivos.find(pagamento => pagamento.user_id === user_id);

      if (encontrado) {

        interaction.reply({content: 'Você ja tem um registro de pagamento, por favor cancele a compra atual para abrir uma nova!', ephemeral: true })

      } else {

          const modal = new ModalBuilder()
              .setCustomId('searchModal')
              .setTitle(`Pesquisa de Skins`);
        
          const questionInput = new TextInputBuilder()
              .setCustomId('campeaoInput')
              .setLabel("Digite o nome de um campeão")
              .setStyle(TextInputStyle.Short);
        
          const firstActionRow = new ActionRowBuilder().addComponents(questionInput);
        
          modal.addComponents(firstActionRow);
        
          interaction.showModal(modal);    
      }
    }
    
  });

  collector.on('end', () => {
    channel.delete().catch(() => [])
  });
  
}