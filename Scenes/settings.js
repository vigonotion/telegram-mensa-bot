module.exports = function(app) {

  const Scene = require('telegraf/scenes/base')
  const Extra = require('telegraf/extra')
  const Stage = require('telegraf/stage')
  const Markup = require('telegraf/markup')
  const _ = require('lodash');

  const s_add_canteen = "➕ Mensa hinzufügen"
  const s_del_canteen = "➖ Mensa entfernen"

  const settings = new Scene('settings')
  settings.enter((ctx) => ctx.replyWithMarkdown('*Einstellungen*\nWie kann ich dir helfen?', Markup
      .keyboard([s_add_canteen, s_del_canteen, 'Abbrechen']) //«
      .oneTime()
      .resize()
      .extra()
    ))

  // settings.leave((ctx) => ctx.reply("Ich hoffe, jetzt ist alles recht so. Wenn nicht, frag mich einfach nochmal!", Extra.markup(Markup.removeKeyboard())))
  settings.hears('Abbrechen', app.leave())

  settings.hears(s_add_canteen, (ctx) => ctx.reply('Wie möchtest du deine Mensa wählen?', Markup
      .keyboard([Markup.locationRequestButton('📍 Standort senden'), '🔎 Per Name suchen']) //«
      .oneTime()
      .resize()
      .extra()
    ))

  settings.on('location', (ctx) => {


    fetch('http://openmensa.org/api/v2/canteens?near[lat]='+ctx.message.location.latitude+'&near[lng]=' + ctx.message.location.longitude)
    .then(res => res.json())
    .then(json => {
      if (!error && response.statusCode == 200) {
        var results = [];
          _.each(JSON.parse(body), function(element) {
            results.push(element.name + " #" + element.id)
          })

          ctx.reply('Ich habe diese Mensen in der Nähe (10km) gefunden. Welche möchtest du hinzufügen?', Markup
              .keyboard(results) //«
              .oneTime()
              .resize()
              .extra()
            )

       }
    
    })

  })

  settings.hears('🔎 Per Name suchen', app.enter('search'))

  settings.hears(s_del_canteen, app.enter('canteen_delete'))

  settings.hears("🥕", (ctx) => {
    if(app.db.get('users')
    .find({ user_id: ctx.from.id })
    .value() === undefined) {
      app.db.get('users')
        .push({
          user_id: ctx.from.id,
          veggiefilter: true,
          veganfilter: false
         })
         .write()
    } else {
      app.db.get('users')
        .find({ user_id: ctx.from.id })
        .assign({
          veggiefilter: true,
          veganfilter: false
         })
         .write()
    }

    ctx.replyWithMarkdown("Du hast den ultrageheimen Veggie-Filter aktiviert.", Extra.markup(Markup.removeKeyboard()))

    app.leave()
  })

  settings.hears("🌴", (ctx) => {
    if(app.db.get('users')
    .find({ user_id: ctx.from.id })
    .value() === undefined) {
      app.db.get('users')
        .push({
          user_id: ctx.from.id,
          veganfilter: true
         })
         .write()
    } else {
      app.db.get('users')
        .find({ user_id: ctx.from.id })
        .assign({
          veganfilter: true
         })
         .write()
    }

    ctx.replyWithMarkdown("Die Veganer-Polizei überwacht jetzt diesen Speiseplan..", Extra.markup(Markup.removeKeyboard()))

    app.leave()
  })

  settings.hears("🐖", (ctx) => {
    if(app.db.get('users')
    .find({ user_id: ctx.from.id })
    .value() === undefined) {
      app.db.get('users')
        .push({
          user_id: ctx.from.id,
          veggiefilter: false
         })
         .write()
    } else {
      app.db.get('users')
        .find({ user_id: ctx.from.id })
        .assign({
          veggiefilter: false
         })
         .write()
    }

    ctx.replyWithMarkdown("Du hast den ultrageheimen Veggie-Filter deaktiviert.", Extra.markup(Markup.removeKeyboard()))

    app.leave()
  })




  settings.hears("🔄🚫", (ctx) => {
    if(app.db.get('users')
    .find({ user_id: ctx.from.id })
    .value() === undefined) {
      app.db.get('users')
        .push({
          user_id: ctx.from.id,
          everydayfilter: true
         })
         .write()
    } else {
      app.db.get('users')
        .find({ user_id: ctx.from.id })
        .assign({
          everydayfilter: true
         })
         .write()
    }

    ctx.replyWithMarkdown("Du hast den ultrageheimen tägliche-Gerichte-Filter aktiviert.", Extra.markup(Markup.removeKeyboard()))

    app.leave()
  })

  settings.hears("🔄", (ctx) => {
    if(app.db.get('users')
    .find({ user_id: ctx.from.id })
    .value() === undefined) {
      app.db.get('users')
        .push({
          user_id: ctx.from.id,
          everydayfilter: false
         })
         .write()
    } else {
      app.db.get('users')
        .find({ user_id: ctx.from.id })
        .assign({
          everydayfilter: false
         })
         .write()
    }

    ctx.replyWithMarkdown("Du hast den ultrageheimen tägliche-Gerichte-Filter deaktiviert.", Extra.markup(Markup.removeKeyboard()))

    app.leave()
  })

  return settings
}
