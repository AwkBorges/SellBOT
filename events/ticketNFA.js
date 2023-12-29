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
  .setTitle(`Carrinho - NFA`)
  .setDescription("Escolha através dos botões a quantidade de skins.\nEsse carrinho irá fechar em 3 horas.");

const buttons1 = new Discord.ActionRowBuilder().addComponents(
    new Discord.ButtonBuilder()
    .setCustomId("1a10")
    .setLabel("1-10")
    .setEmoji("💎")
    .setStyle(Discord.ButtonStyle.Primary),
    new Discord.ButtonBuilder()
    .setCustomId("10a50")
    .setLabel("10-50")
    .setEmoji("💎")
    .setStyle(Discord.ButtonStyle.Primary),
    new Discord.ButtonBuilder()
    .setCustomId("51a100")
    .setLabel("51-100")
    .setEmoji("💎")
    .setStyle(Discord.ButtonStyle.Primary),
    new Discord.ButtonBuilder()
    .setCustomId("101a200")
    .setLabel("101-200")
    .setEmoji("💎")
    .setStyle(Discord.ButtonStyle.Primary),
);

const buttons2 = new Discord.ActionRowBuilder().addComponents(
  new Discord.ButtonBuilder()
    .setCustomId("2021a300")
    .setLabel("201-300")
    .setEmoji("💎")
    .setStyle(Discord.ButtonStyle.Primary),
);

module.exports = async function(interaction) {

  const channelName = `🧌﹒NFA﹒${interaction.user.username}`;
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
    
  const message = await channel.send({ embeds: [embed], components: [buttons1, buttons2] });
  
  const collector = message.createMessageComponentCollector({
    componentType: 2,
    time: 45 * 60 * 1000 * 4
  });

  collector.on('collect', async (interaction) => {
    
  });

  collector.on('end', () => {
    channel.delete().catch(() => [])
  });
  
}