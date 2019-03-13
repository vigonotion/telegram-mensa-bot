module.exports = function(app) {

  const Scene = require('telegraf/scenes/base')
  const _ = require('lodash');
  const Markup = require('telegraf/markup')
  const Extra = require('telegraf/extra')

  const search = new Scene('search')

  search.enter((ctx) => ctx.replyWithMarkdown('*Mensa suchen*\nBitte gib den Namen deiner Mensa ein:'))

  search.hears("Abbrechen", app.leave())

  search.hears(/(.+)#(\d+)/gm, (ctx) => {

    if(app.db.get('users')
    .find({ user_id: ctx.from.id })
    .value() === undefined) {
      app.db.get('users')
        .push({
          user_id: ctx.from.id,
          canteens: [parseInt(ctx.match[2])]
         })
         .write()
    } else {
      app.db.get('users')
       .find({ user_id: ctx.from.id })
       .get('canteens')
       .push(parseInt(ctx.match[2]))
       .write()
    }
    ctx.replyWithMarkdown("_" + ctx.match[1] + "_ wurde zu deinen Mensen hinzugefügt.\nSieh dir deinen Speiseplan mit /today an.", Extra.markup(Markup.removeKeyboard()))


    ctx.scene.leave()

  })

  search.on('message', (ctx) => {

    let rawRes = app.db.get('canteens')
      .filter(function(c) {
        if(c.name === undefined) return false
        return c.name.toLowerCase().includes(ctx.message.text.toLowerCase())
      }).value()

    let results = [];
      _.each(rawRes, function(element) {
        results.push(element.name + " #" + element.id)
      })
      results.push("Abbrechen")

      ctx.reply('Ich habe diese Mensen gefunden. Welche ist deine?', Markup
          .keyboard(results) //«
          .oneTime()
          .resize()
          .extra()
        )


    //ctx.scene.leave()
  })



  //search.leave((ctx) => ctx.reply("Suche beendet."))

  return search
}
