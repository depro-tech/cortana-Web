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

const chalk = require('chalk')

const color = (text, color) => {
    return !color ? chalk.green(text) : chalk.keyword(color)(text)
}

const bgcolor = (text, bgcolor) => {
    return !bgcolor ? chalk.green(text) : chalk.bgKeyword(bgcolor)(text)
}

const Lognyong = (text, color) => {
    return !color ? chalk.yellow('[ ! ] ') + chalk.green(text) : chalk.yellow('=> ') + chalk.keyword(color)(text)
}

module.exports = {
    color,
    bgcolor,
    Lognyong
}
