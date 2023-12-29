const { Client, GatewayIntentBits, ActionRowBuilder, Events, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const Discord = require("discord.js");
require('dotenv').config()
const fs = require('fs');
const axios = require('axios');
const uuid = require('uuid');
const qrcode = require('qrcode');
const { AttachmentBuilder } = require('discord.js');

const client = new Discord.Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	],
});

module.exports = client

client.on('interactionCreate', (interaction) => {

  if(interaction.type === Discord.InteractionType.ApplicationCommand){

      const cmd = client.slashCommands.get(interaction.commandName);

      if (!cmd) return interaction.reply(Error);

      interaction["member"] = interaction.guild.members.cache.get(interaction.user.id);

      cmd.run(client, interaction)

   }
})

client.slashCommands = new Discord.Collection()
require('./handler')(client)
client.login(process.env.TOKEN)

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`)
    main().catch((error) => {
      console.error('Ocorreu um erro:', error);
    });
  })

async function verificarPagamentosAprovados(pagamentos) {
    const pagamentosAprovados = [];
  
    for (const pagamento of pagamentos) {
      try {
        const response = await axios.get(`https://api.mercadopago.com/v1/payments/${pagamento.mp_id}`, {
          headers: {
            Authorization: `Bearer ${process.env.MPTOKEN}`,
          },
        });
  
        if (response.data.status === 'approved') {
          pagamentosAprovados.push(pagamento.mp_id);
        }
      } catch (error) {
        console.error(`Erro ao verificar pagamento ${pagamento.mp_id}:`, error.message);
      }
    }
  
    return pagamentosAprovados;
  }
  
function lerPagamentosAtivos() {
    const jsonPagAtivosData = fs.readFileSync('./databases/pagAtivos.json', 'utf8');
    return JSON.parse(jsonPagAtivosData);
  }
  
async function main() {
    setInterval(async () => {
      const pagamentosAtivos = lerPagamentosAtivos();
      const pagamentosAprovados = await verificarPagamentosAprovados(pagamentosAtivos);
  
      const jsonPagAtivosData = fs.readFileSync('./databases/pagAtivos.json', 'utf8');
      const pagAtivos = JSON.parse(jsonPagAtivosData);
  
      for (const mp_id of pagamentosAprovados) {
        const pagamentoAprovado = pagAtivos.find((pagamento) => pagamento.mp_id === mp_id);
      
        if (pagamentoAprovado) {
          const { user_id, ...rest } = pagamentoAprovado;
      
          const dadosConta = pagAtivos.find((pagamento) => pagamento.user_id === user_id);
      
          if (dadosConta) {
            const user = await client.users.fetch(user_id);
            const button = new Discord.ActionRowBuilder().addComponents(
              new Discord.ButtonBuilder()
              .setCustomId("save")
              .setEmoji("💾")
              .setStyle(Discord.ButtonStyle.Primary),
              new Discord.ButtonBuilder()
              .setCustomId("rate")
              .setEmoji("⭐")
              .setStyle(Discord.ButtonStyle.Primary))

            const embed = new Discord.EmbedBuilder()
              .setColor(0x030303)
              .setThumbnail(user.avatarURL())
              .setDescription(`
              **Login:** ${dadosConta.login} | **Senha:** ${dadosConta.password}\n
              **Level:** ${dadosConta.level} | **EA:** ${dadosConta.essencia}\n
              **Nickname:** ${dadosConta.nickname}\n
              **Email:** ${dadosConta.email}\n
              **Nascimento:** ${dadosConta.nascimento} | **Criação:** ${dadosConta.criacao}\n
              **Provedor:** ${dadosConta.provedor}\n
              **Informações de Pagamento:**\n
              **Identificador:** ${dadosConta.uuid}
              **Data:** ${dadosConta.data_compra}\n
              Salve suas informações e por favor nos avalie em nosso Discord.
              
              `)
              .setFooter({ text:`Obrigado por comprar com a ${process.env.NAME}!  🦝🖤`})
              try{

                const channel = client.channels.cache.get(dadosConta.channel_id);
                channel.send(({ embeds: [embed], components: [button]}))
  
                const embedLog = new Discord.EmbedBuilder()
                .setColor(0x00E4FF)
                .setTitle(`Venda Realizada`)
                .setDescription(`**Compra:** ${dadosConta.uuid}\n**User:** ${user_id}\n **Login:** ${dadosConta.login}\n **Responsável:** ${dadosConta.password}`)
  
                const channelLOG = client.channels.cache.get(process.env.LOGCARRINHOS)
                const vendasLOG = client.channels.cache.get(process.env.VENDAS)
                channelLOG.send({ embeds: [embedLog]})
                vendasLOG.send({ embeds: [embedLog]})


                const guild = await client.guilds.fetch(process.env.GUILD);
                const member = await guild.members.fetch(user_id);
                const role = guild.roles.cache.get(process.env.CLIENTE);

                if (member && role) {
                  await member.roles.add(role);
                  
                }
                

                const messageId = String(dadosConta.embed_id);
                channel.messages.delete(messageId)
                  .then(() => {
                    //console.log('Mensagem deletada com sucesso!');
                  })
                  .catch(error => {
                    console.error('Erro ao deletar a mensagem:', error);
                  });

                fs.appendFile(
                  './databases/vendas.txt',
                  `${dadosConta.uuid};${dadosConta.user_id};${dadosConta.data_compra};${dadosConta.login};${dadosConta.password};${dadosConta.valorAtualizado};${dadosConta.cupom}\n`,
                  (error) => {
                    if (error) {
                      console.error(error);
                    }
                  }
                );
                
                
  
              }catch(error){
                console.log(error)
              }            
          }
      
          const novoPagAtivos = pagAtivos.filter((pagamento) => pagamento.mp_id !== mp_id);
          fs.writeFileSync('./databases/pagAtivos.json', JSON.stringify(novoPagAtivos, null, 2));
        }
      }
  
      //console.log('Pagamentos Aprovados:', pagamentosAprovados);
  
    }, 2000);
  }

async function searchSkin(interaction)  {

    function capitalizeWords(str) {

        return str.replace(/\b\w/g, (char) => char.toUpperCase());

      }
      
      function normalizeCampeaoName(name) {

        const cleanedName = name.replace(/[^\w\s']/gi, '');
        const normalizedName = capitalizeWords(cleanedName);
        return normalizedName;

      }
      
        const campeaoInput = interaction.fields.getTextInputValue('campeaoInput');
        const formattedCampeaoInput = campeaoInput.toLowerCase();
        
        function readChampionsData(filePath) {
            return new Promise((resolve, reject) => {
              fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                  reject(err);
                  return;
                }
                
                const jsonData = JSON.parse(data);
                resolve(jsonData);
              });
            });
          }

          async function getChampionNames() {
            try {
              const championsData = await readChampionsData('./databases/champions.json');
              const championNames = championsData.map(champion => champion.name);
              return championNames;
            } catch (error) {
              console.error(error);
              return [];
            }
          }

          async function getChampionIdByName(championName) {
            try {
              const championsData = await readChampionsData('./databases/champions.json');
              const champion = championsData.find(champion => champion.name === championName);
              if (champion) {
                return champion.id;
              } else {
                return null; 
              }
            } catch (error) {
              console.error(error);
              return null;
            }
          }

          const championsData = await getChampionNames();

          if (!championsData.some(championName => championName.toLowerCase() === formattedCampeaoInput)) {

            interaction.reply({
              content: `Esse campeão não existe no League of Legends!`,
              ephemeral: true
            });
        }else{

            function readEstoque(filePath) {
                return new Promise((resolve, reject) => {
                  fs.readFile(filePath, 'utf8', (err, data) => {
                    if (err) {
                      reject(err);
                      return;
                    }
                    
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                  });
                });
              }
        
              const estoqueData = await readEstoque('./databases/estoque.json')
        
              const championName = normalizeCampeaoName(formattedCampeaoInput);
        
              const skinsArray = [];
              const valoresArray = [];
              
              estoqueData.forEach(accounts => {
                accounts.skins.forEach(skin => {
                  if (skin.includes(championName)) {
                    const skinValue = accounts.valor;
                    const existingIndex = skinsArray.indexOf(skin);
              
                    if (existingIndex === -1) {
                      skinsArray.push(skin);
                      valoresArray.push(skinValue);
                    } else if (skinValue < valoresArray[existingIndex]) {
                      valoresArray[existingIndex] = skinValue;
                    }
                  }
                });
              });
              
              function readSplashData(filePath) {
                return new Promise((resolve, reject) => {
                  fs.readFile(filePath, 'utf8', (err, data) => {
                    if (err) {
                      reject(err);
                      return;
                    }
                    
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                  });
                });
              }
        
              const splashData = await readSplashData('./databases/champions.json');
              const splashArray = [];
        
              skinsArray.forEach(skin => {
                splashData.forEach(champion => {
                  const skinIndex = champion.skins.name.indexOf(skin);
                  if (skinIndex !== -1) {
                    const skinImage = champion.skins.image[skinIndex];
                    splashArray.push(skinImage);
                  }
                });
              });

              const rarityEmojis = {
                "EPIC": "<:epic:902712385201135657>",
                "LEGENDARY": "<:legendary:902712385100472392>",
                "ULTIMATE": "<:ultimate:902712384819449857>",
                "MYTHIC": "<:mythic:902712385104642098>",
                "DEFAULT": "<:default:902712385238888510>"
              };

              function getRarityForSkin(skinName, estoqueData) {
                for (const account of estoqueData) {
                  const skinIndex = account.skins.indexOf(skinName);
                  if (skinIndex !== -1) {
                    const skinRarity = account.skinsRarity[skinIndex];
                    // Extrai a raridade entre parênteses
                    const match = /\(([^)]+)\)/.exec(skinRarity);
                    if (match && match[1]) {
                      return match[1].trim().toUpperCase(); // Retorna a raridade em maiúsculas, removendo espaços em branco
                    }
                  }
                }
                return "DEFAULT"; // Se a skin não for encontrada, use o padrão
              }
        
            const skinsWithValues = [];
              for (let i = 0; i < skinsArray.length; i++) {
                const skin = skinsArray[i];
                const valor = valoresArray[i];
                const rarity = getRarityForSkin(skin, estoqueData); // Função para obter a raridade da skin
                const rarityEmoji = rarityEmojis[rarity] || rarityEmojis["DEFAULT"]; // Obtém o emoji correspondente ou o emoji padrão se a raridade não for encontrada
                skinsWithValues.push(`${rarityEmoji} ${skin} ➝  **R$ ${valor}**`);
              }
              
              const skinsString = skinsWithValues.join('\n');
        
              if(skinsArray.length === 0){
        
                const championId = await getChampionIdByName(normalizeCampeaoName(formattedCampeaoInput));
                //console.log(championId)
                const embed = new Discord.EmbedBuilder()
                .setTitle('Skins em nosso estoque:')
                .setDescription(`\n\nNão foi encontrado skins para esse campeão em nosso estoque`)
                .setColor(0x030303)
                .setImage(`https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championId}_0.jpg`);
                await interaction.reply({ embeds: [embed], ephemeral: true})
        
              }else{
        
                  const randomIndex = Math.floor(Math.random() * splashArray.length);
                  const randomSplash = splashArray[randomIndex];
                  const embed = new Discord.EmbedBuilder()
                    .setTitle('Skins em nosso estoque:')
                    .setDescription(`\n\n${skinsString}`)
                    .setColor(0x030303)
                    .setImage(randomSplash);
                  const button = new Discord.ActionRowBuilder().addComponents(
                        new Discord.ButtonBuilder()
                        .setCustomId("buySmurf")
                        .setLabel("Comprar")
                        .setEmoji("✉️")
                        .setStyle(Discord.ButtonStyle.Primary),
                    );   
                 await interaction.reply({ embeds: [embed], components: [button], ephemeral: true })

              }
        
        
        }
}

async function buySmurf(interaction, filePath) {
  const compraInput = interaction.fields.getTextInputValue('compraInput');
  const cupom = interaction.fields.getTextInputValue('cupomInput');
  const cupons = fs.readFileSync('./databases/cupons.txt', 'utf8').split('\n');

  function readEstoque(filePath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        
        const jsonData = JSON.parse(data);
        resolve(jsonData);
      });
    });
  }

  const estoqueData = await readEstoque(filePath);

  let foundSkin = false;
  let lowestValue = Infinity;
  let accountWithLowestValue = null;
  const currentDate = new Date();

  estoqueData.forEach(account => {
    if (account.skins.includes(compraInput)) {
      foundSkin = true;
      if (account.valor < lowestValue) {
        lowestValue = account.valor;
        accountWithLowestValue = {
          uuid: uuid.v4(),
          data_compra: `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`,
          user_id: interaction.user.id,
          ...account
        };
      }
    }
  });

  if (foundSkin) {
    const index = estoqueData.findIndex(account => account.skins.includes(compraInput));
    if (index !== -1) {
      const removedAccount = estoqueData.splice(index, 1)[0];
      fs.writeFileSync('./databases/estoque.json', JSON.stringify(estoqueData, null, 2));
    } else {
      interaction.reply({ content: `A skin "${compraInput}" não existe no estoque.`, ephemeral: true });
    }

    const { valor } = accountWithLowestValue;
    const transactionAmount = cupom !== null && cupons.includes(cupom) ? parseFloat((valor - valor * 0.1).toFixed(2)) : valor;
    const description = `Smurf - ${compraInput}`;
    const buyerName = 'Nome do comprador';
    const buyerEmail = 'email@example.com';
    const buyerCPF = '47161952441';
    const accessToken = process.env.MPTOKEN;
    const apiUrl = 'https://api.mercadopago.com/v1/payments';

    const paymentData = {
      transaction_amount: transactionAmount,
      description: description,
      payment_method_id: 'pix',
      payer: {
        email: buyerEmail,
        identification: {
          type: 'CPF',
          number: buyerCPF
        },
        first_name: buyerName
      }
    };

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    };

    fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(paymentData)
    })
      .then(response => response.json())
      .then(async data => {
        const paymentID = data.id;
        const pixKey = data.point_of_interaction.transaction_data.qr_code;
        const ticketUrl = data.point_of_interaction.transaction_data.ticket_url;

        async function generateQRCode(pixKey) {
          try {
            const qrCodeDataUrl = await qrcode.toDataURL(pixKey);
            const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
            const qrCodeBuffer = Buffer.from(base64Data, 'base64');
            fs.writeFileSync('./databases/qrcode.png', qrCodeBuffer);
          } catch (err) {
            console.error('Erro ao gerar o QR code:', err);
          }
        }

        try {
          await generateQRCode(pixKey);
        } catch (err) {
          console.error('Erro ao gerar o QR code:', err);
        }

        const file = new AttachmentBuilder('./databases/qrcode.png');
        const { user_id, uuid, data_compra, login, password, valor, server, level, essencia, nickname, email, nascimento, criacao, provedor, skins, skinsRarity } = accountWithLowestValue;
        const pagAtivosData = JSON.parse(fs.readFileSync('./databases/pagAtivos.json', 'utf8'));
        const maskedLogin = login.substring(0, 4) + '*'.repeat(login.length - 4);
        const skinsString = skins.join('\n');

        const pagAtivosEntry = {
          mp_id: paymentID,
          user_id: user_id,
          uuid: uuid,
          data_compra: data_compra,
          cupom: cupom,
          pix: pixKey,
          channel_id: interaction.channel.id,
          server: server,
          valor: valor,
          valorAtualizado: transactionAmount,
          login: login,
          password: password,
          level: level,
          essencia: essencia,
          nickname: nickname,
          email: email,
          nascimento: nascimento,
          criacao: criacao,
          provedor: provedor,
          skins: skins,
          skinsRarity: skinsRarity,
          embed_id: null,
        };

        pagAtivosData.push(pagAtivosEntry);

        fs.writeFileSync('./databases/pagAtivos.json', JSON.stringify(pagAtivosData, null, 2));

        const embed = new Discord.EmbedBuilder()
          .setColor(0x030303)
          .setTitle(`ID: ${uuid}`)
          .setDescription(`**Skin selecionada:** ${compraInput}\n **Login:** ${maskedLogin}\n **Valor:** ${transactionAmount}\n\n**Skins:** \n${skinsString}\n\n
          🔒 Cancelar Compra\n
          💵 Código PIX copia e cola\n
          `)
          .setThumbnail('attachment://qrcode.png');

        const button = new Discord.ActionRowBuilder().addComponents(
          new Discord.ButtonBuilder()
            .setCustomId("close")
            .setEmoji("🔒")
            .setStyle(Discord.ButtonStyle.Danger),
          new Discord.ButtonBuilder()
            .setCustomId("pix")
            .setEmoji("💵")
            .setStyle(Discord.ButtonStyle.Success),
          new Discord.ButtonBuilder()
            .setLabel('PIX Ticket')
            .setURL(`${ticketUrl}`)
            .setStyle(Discord.ButtonStyle.Link)
        );

          interaction.reply({ embeds: [embed], components: [button], files: [file] })
          const message = await interaction.fetchReply()
          const replyMessageID = message.id
          pagAtivosEntry.embed_id = replyMessageID
          fs.writeFileSync('./databases/pagAtivos.json', JSON.stringify(pagAtivosData, null, 2));

        const embedLog = new Discord.EmbedBuilder()
          .setColor(0xA2FF00)
          .setTitle(`Compra aberta - Smurf`)
          .setDescription(`**Compra:** ${uuid}\n**Skin:** ${compraInput}\n**User:** ${interaction.user.username}\n **UserID:** ${interaction.user.id}\n **Login:** ${login}\n **Senha:** ${password}`);

        const channelLOG = interaction.guild.channels.cache.get(process.env.LOGCARRINHOS);
        channelLOG.send({ embeds: [embedLog] });
      });
  } else {
    interaction.reply({ content: "Skin fora de estoque ou digitada de maneira errada", ephemeral: true });
  }
}

async function buySmurfRandom(interaction, filePath) {
  
  function readEstoque(filePath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        
        const jsonData = JSON.parse(data);
        resolve(jsonData);
      });
    });
  }

  const estoqueData = await readEstoque(filePath);

  const account = estoqueData[0];
  const currentDate = new Date();

  if (estoqueData.length > 0) {

      estoqueData.shift();
      fs.writeFileSync(filePath, JSON.stringify(estoqueData, null, 2));

      const transactionAmount = Number(process.env.RANDOM) //random price
      const description = `Smurf - Random}`;
      const buyerName = 'Nome do comprador';
      const buyerEmail = 'email@example.com';
      const buyerCPF = '47161952441';
      const accessToken = process.env.MPTOKEN;
      const apiUrl = 'https://api.mercadopago.com/v1/payments';

      const paymentData = {
          transaction_amount: transactionAmount,
          description: description,
          payment_method_id: 'pix',
          payer: {
            email: buyerEmail,
            identification: {
              type: 'CPF',
              number: buyerCPF
            },
            first_name: buyerName
          }
        };

        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        };

        fetch(apiUrl, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(paymentData)
        })
        .then(response => response.json())
        .then(async data => {
          const paymentID = data.id;
          const pixKey = data.point_of_interaction.transaction_data.qr_code;
          const ticketUrl = data.point_of_interaction.transaction_data.ticket_url;
  
          async function generateQRCode(pixKey) {
            try {
              const qrCodeDataUrl = await qrcode.toDataURL(pixKey);
              const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
              const qrCodeBuffer = Buffer.from(base64Data, 'base64');
              fs.writeFileSync('./databases/qrcode.png', qrCodeBuffer);
            } catch (err) {
              console.error('Erro ao gerar o QR code:', err);
            }
          }
  
          try {
            await generateQRCode(pixKey);
          } catch (err) {
            console.error('Erro ao gerar o QR code:', err);
          }
  
          const file = new AttachmentBuilder('./databases/qrcode.png');
          const {login, password, valor, server, level, essencia, nickname, email, nascimento, criacao, provedor, skins, skinsRarity } = account;
          const pagAtivosData = JSON.parse(fs.readFileSync('./databases/pagAtivos.json', 'utf8'));
          const maskedLogin = login.substring(0, 4) + '*'.repeat(login.length - 4);
          const skinsString = skins.join('\n');

          const uuidRandom = uuid.v4()
  
          const pagAtivosEntry = {
            mp_id: paymentID,
            user_id: interaction.user.id,
            uuid: uuidRandom,
            data_compra: `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`,
            cupom: null,
            pix: pixKey,
            channel_id: interaction.channel.id,
            server: server,
            valor: valor,
            valorAtualizado: transactionAmount,
            login: login,
            password: password,
            level: level,
            essencia: essencia,
            nickname: nickname,
            email: email,
            nascimento: nascimento,
            criacao: criacao,
            provedor: provedor,
            skins: skins,
            skinsRarity: skinsRarity,
            embed_id: null,
          };
  
          pagAtivosData.push(pagAtivosEntry);
  
          fs.writeFileSync('./databases/pagAtivos.json', JSON.stringify(pagAtivosData, null, 2));
  
          const embed = new Discord.EmbedBuilder()
            .setColor(0x030303)
            .setTitle(`ID: ${uuidRandom}`)
            .setDescription(`**Skin selecionada:** Random\n **Login:** ${maskedLogin}\n **Valor:** ${transactionAmount}\n\n
            🔒 Cancelar Compra\n
            💵 Código PIX copia e cola\n
            `)
            .setThumbnail('attachment://qrcode.png');
  
          const button = new Discord.ActionRowBuilder().addComponents(
            new Discord.ButtonBuilder()
              .setCustomId("close")
              .setEmoji("🔒")
              .setStyle(Discord.ButtonStyle.Danger),
            new Discord.ButtonBuilder()
              .setCustomId("pix")
              .setEmoji("💵")
              .setStyle(Discord.ButtonStyle.Success),
            new Discord.ButtonBuilder()
              .setLabel('PIX Ticket')
              .setURL(`${ticketUrl}`)
              .setStyle(Discord.ButtonStyle.Link)
          );
  
            interaction.reply({ embeds: [embed], components: [button], files: [file] })
            const message = await interaction.fetchReply()
            const replyMessageID = message.id
            pagAtivosEntry.embed_id = replyMessageID
            fs.writeFileSync('./databases/pagAtivos.json', JSON.stringify(pagAtivosData, null, 2));
  
          const embedLog = new Discord.EmbedBuilder()
            .setColor(0xA2FF00)
            .setTitle(`Compra aberta - Smurf`)
            .setDescription(`**Compra:** ${uuidRandom}\n**Skin:** Random \n**User:** ${interaction.user.username}\n **UserID:** ${interaction.user.id}\n **Login:** ${login}\n **Senha:** ${password}`);
  
          const channelLOG = interaction.guild.channels.cache.get(process.env.LOGCARRINHOS);
          channelLOG.send({ embeds: [embedLog] });
        });
  }else {
      interaction.reply({ content: "Sem contas no estoque", ephemeral: true });
    }
}


client.on("interactionCreate", (interaction) => {

    if (interaction.isButton()) {
  
      if (interaction.customId === 'smurf') {
        require('./events/ticketSmurfs')(interaction);
      }

      if (interaction.customId === 'nfa'){
        require('./events/ticketNFA')(interaction);
      }

      if (interaction.customId === "buySmurf"){

        const modal = new ModalBuilder()
        .setCustomId('buySmurfModal')
        .setTitle('Compra de SMURF com Skin');

        const compraInput = new TextInputBuilder()
          .setCustomId('compraInput')
          .setLabel("Digite o nome da Skin que deseja igual o BOT mostra:")
          .setStyle(TextInputStyle.Short);

        const cupomInput = new TextInputBuilder()
          .setCustomId('cupomInput')
          .setLabel("Possui um cupom?")
          .setStyle(TextInputStyle.Short)
          .setRequired(false);

        const firstActionRow = new ActionRowBuilder().addComponents(compraInput);
        const secondActionRow = new ActionRowBuilder().addComponents(cupomInput);
    
        modal.addComponents(firstActionRow, secondActionRow);

        interaction.showModal(modal);
      }

      if(interaction.customId === "buyRandom"){

        let pagAtivos = [];

        const caminhoDoArquivo = './databases/pagAtivos.json';
        
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
  
        } else{

          buySmurfRandom(interaction, './databases/estoque.json')

        }
  
      }

      if (interaction.customId === "close"){

        const userID = interaction.user.id

        const jsonPagAtivosData = fs.readFileSync('./databases/pagAtivos.json', 'utf8');
        const originalData = JSON.parse(jsonPagAtivosData);

        const removedObject = originalData.find(obj => obj.user_id === userID);

        if (removedObject) {

          const { mp_id, user_id, uuid, data_compra, cupom, pix, channel_id, valorAtualizado, embed_id, ...newObject } = removedObject;
        
          const updatedData = originalData.filter(obj => obj.user_id !== userID);

          const jsonEstoqueData = fs.readFileSync('./databases/estoque.json', 'utf8');
          const estoqueData = JSON.parse(jsonEstoqueData);
          estoqueData.push(newObject);

          fs.writeFileSync('./databases/pagAtivos.json', JSON.stringify(updatedData, null, 2));
        
          fs.writeFileSync('./databases/estoque.json', JSON.stringify(estoqueData, null, 2));
    
          const embedLog = new Discord.EmbedBuilder()
          .setColor(0xFF0000 )
          .setTitle(`Compra cancelada`)
          .setDescription(`**Compra:** ${uuid}\n**User:** ${interaction.user.username}\n**UserID:** ${userID}\n **Login:** ${newObject.login}`)

          const channelLOG = interaction.guild.channels.cache.get(process.env.LOGCARRINHOS)
          channelLOG.send({ embeds: [embedLog] })

        } else {

          interaction.reply({content: 'Erro na tentativa de cancelar a compra.', ephemeral: false })

        }

        interaction.reply({content: 'Estamos cancelando a sua compra.', ephemeral: true })

        setTimeout ( () => {
          try { 
            interaction.message.delete()
          } catch (e) {
            return;
          }
        }, 3000)

      }

      if(interaction.customId === "pix"){


        const pagAtivosData = fs.readFileSync('./databases/pagAtivos.json');
        const pagAtivos = JSON.parse(pagAtivosData);
  
        const userID = interaction.user.id;
        const usuarioEncontrado = pagAtivos.find((pagAtivo) => pagAtivo.user_id === userID);
  
        if (usuarioEncontrado) {
  
          
          const pix = usuarioEncontrado.pix;
          interaction.reply({content: pix, ephemeral: true})
          
          
        } else {
          
        }
          
      }
  
     if(interaction.customId === "save"){

      const user = interaction.user;
      const { embeds } = interaction.message;

        try{
          user.send({ embeds });
          interaction.reply({ content: 'Conta enviada com sucesso!', ephemeral: true });
        }catch(error){
          console.error('Erro ao enviar mensagem para a DM do usuário:', error);
          interaction.reply({ content: 'Sua DM está fechada, abra e tente novamente.', ephemeral: true });
        }
      }

      if(interaction.customId === "rate"){
        interaction.reply({ content: 'Por favor nos avalie em <#1147451696306458664> 🥹', ephemeral: true });
      }

    }

    if (interaction.isModalSubmit()){ 
    
        if(interaction.customId === 'searchModal') {

          searchSkin(interaction)

        }

        if(interaction.customId === 'buySmurfModal'){
          
          buySmurf(interaction, './databases/estoque.json')

        }
    }

})