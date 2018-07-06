module.exports = function(app) {

  const Scene = require('telegraf/scenes/base')

  const search = new Scene('settings-searchbyname')
  //search.enter((ctx) => ctx.reply("Hallo?"))
  search.on('message', (ctx) => {
    ctx.telegram.sendCopy(ctx.from.id, ctx.message)
    app.leave()
  })
  search.leave((ctx) => ctx.reply("Suche beendet."))

  return search
}
