const fs = require('fs');
const filePath = './databases/contas.txt';
const estoquePath = './databases/estoque.json';
require('dotenv').config()

let fileSplited = fs.readFileSync(filePath).toString().split('\n');
let existingData = [];

try {
  existingData = JSON.parse(fs.readFileSync(estoquePath));
} catch (error) {
  console.error('Falha ao ler o arquivo JSON do estoque');
  throw error;
}

for (let i = 0; i < fileSplited.length; i += 1) {
  itemSplited = fileSplited[i].split(':');
  const server = itemSplited[0];
  const login = itemSplited[1];
  const password = itemSplited[2];
  const level = itemSplited[3];
  const essencia = itemSplited[4];
  const nickname = itemSplited[5];
  const email = itemSplited[6];
  const nascimento = itemSplited[7];
  const criacao = itemSplited[8];
  const provedor = itemSplited[9];

  const skinSplitted = itemSplited[10].split("-");
  const skins = [];

  skinSplitted.forEach(item => {
    const trimmedItem = item.trim();
    const itemName = trimmedItem.split(" (")[0];
    skins.push(itemName);
  });

  const skinsRarity = itemSplited[10].split('-');
  //console.log(skinsRarity);

  function getSkinValue(rarity) {
    switch (rarity) {
      case 'MYTHIC':
        return 25.00//Number(process.env.MYTHIC)
      case 'ULTIMATE':
        return 9.99//Number(process.env.ULTIMATE)
      case 'LEGENDARY':
        return 7.25//Number(process.env.LEGENDARY)
      case 'EPIC':
        return 5.49//Number(process.env.EPIC)
      case 'DEFAULT':
        return 4.99//Number(process.env.DEFAULT)
      default:
        return 0;
    }
  }
  console.log(skinsRarity)
  const valor = skinsRarity.reduce((maxValue, skin) => {
    const rarity = skin.match(/\((.*?)\)/)[1];
    const skinValue = getSkinValue(rarity);
    return Math.max(maxValue, skinValue);
  }, 0);

  //console.log(valor);

  existingData.push({
    "server": server,
    "valor": valor,
    "login": login,
    "password": password,
    "level": level,
    "essencia": essencia,
    "nickname": nickname,
    "email": email,
    "nascimento": nascimento,
    "criacao": criacao,
    "provedor": provedor,
    "skins": skins,
    "skinsRarity": skinsRarity
  });
}

const updatedData = JSON.stringify(existingData);

fs.writeFile(estoquePath, updatedData, (error) => {
  if (error) {
    console.error('Falha ao gravar o arquivo JSON do estoque');
    throw error;
  }
  console.log('estoque.json atualizado com sucesso');
});
