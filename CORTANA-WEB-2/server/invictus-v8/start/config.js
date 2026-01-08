/*
 Base Elminator Invictus Version 8.0 By Arul Official-ID 🐉〽️
 Tiktok : https://tiktok.com/@arul_officialll
 Telegram : https://t.me/arulofficialll
 
  ( don't delete the creator's name, please respect it!! )
  
            Kata Kata Hari Ini
      - "Seperti kata orang orang, bila kita berbuat baik pada seseorang, maka hal baik itu akan datang pada diri kita Sendiri"
      
      - "Kesuksesan berawal dari misi dan tantangan, bukan berawal dari zona nyaman"
  
      ~Arul Official-ID - 2025
*/

const fs = require('fs')

const config = {
    owner: "Arul Official-ID",
    botNumber: "6285814233961",
    thumbUrl: "https://files.catbox.moe/rbefof.jpg",
    session: "sessions",
    status: {
        public: true,
        terminal: true,
        reactsw: false
    },
    settings: {
        title: "Elminator Invictus",
        packname: 'Vip Version - 8.0',
        description: "Script By Arul Official-ID",
        author: 'Arul Official-ID',
        footer: "Arul Solo Era"
    },
    newsletter: {
        name: "The Elminator Invictus",
        id: "120363422715901137@newsletter"
    },
}

global.egg = "15"
global.nestid = "5"
global.loc = "1"
global.domain = "-"
global.apikey = "-"
global.capikey = "-"

module.exports = config;

let file = require.resolve(__filename)
require('fs').watchFile(file, () => {
  require('fs').unwatchFile(file)
  console.log('\x1b[0;32m'+__filename+' \x1b[1;32mupdated!\x1b[0m')
  delete require.cache[file]
  require(file)
})
