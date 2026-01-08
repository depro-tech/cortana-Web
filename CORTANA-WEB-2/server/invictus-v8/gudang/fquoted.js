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

const fquoted = {
    packSticker: {
        key: {
            fromMe: false,
            participant: "0@s.whatsapp.net",
            remoteJid: "120363400662819774@g.us"
        },
        message: {
            stickerPackMessage: {
                stickerPackId: "\000",
                name: "YT: Arul Official-ID",
                publisher: "Plenger Jier"
            }
        }
    }
};

module.exports = { fquoted };

let file = require.resolve(__filename)
require('fs').watchFile(file, () => {
  require('fs').unwatchFile(file)
  console.log('\x1b[0;32m'+__filename+' \x1b[1;32mupdated!\x1b[0m')
  delete require.cache[file]
  require(file)
})
