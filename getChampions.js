const axios = require('axios');
const fs = require("fs");

axios.get('http://ddragon.leagueoflegends.com/cdn/13.11.1/data/en_US/champion.json')
.then(function (response) {

    const data = response.data; 
    const names = Object.values(data.data).map(obj => obj.id);
    let adjustedData = []
    async function requestSkins () {
        
        for (let i = 0; i < names.length; i++) {

            const name = names[i];
            console.log(name)
            
            const response = await axios.get(`https://ddragon.leagueoflegends.com/cdn/13.11.1/data/en_US/champion/${name}.json`)
            const dataChamp = response.data.data
            const idChamp = dataChamp[name].id
            const nameChamp = dataChamp[name].name
            const skins = dataChamp[name].skins
            const skinsChamp = []
            const skinSplash = []

            for (const skin of skins) {
                const nomeSkin = skin.name;
                const valueNum = skin.num
                skinsChamp.push(nomeSkin);
                skinSplash.push(`https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${idChamp}_${valueNum}.jpg`)
              }

            adjustedData.push(
                {
                    "id": idChamp,
                    "name": nameChamp,
                    "skins": {
                        "name": skinsChamp,
                        "image": skinSplash
                    }
                
                }
            )

        } 
        
        const champDatabase = JSON.stringify(adjustedData);

        fs.writeFile("./databases/champions.json", champDatabase, (error) => {
            if (error) {
              console.error('Falha ao carregar arquivo JSON');
              throw error;
            }
            console.log("champions.JSON carregado com sucesso");
          });
    }

    requestSkins()
})
.catch(function (error) {

    console.error('Erro na requisição de campeões e skins');

});
