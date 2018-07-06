const Telegraf = require("telegraf")
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const Scene = require('telegraf/scenes/base')

const request = require('request');
const _ = require('lodash');

const { enter, leave } = Stage

const bot = new Telegraf("611161751:AAEFv6EI4l8j9aCv1jx5gAknODDeR9tDopI");

// Database
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync(__dirname + '/Database/db.json')
const db = low(adapter)

// Set some defaults (required if your JSON file is empty)
db.defaults({ users: [] })
  .write()


//bot.use(Telegraf.log())


/// HIDDEN VEGGIE FILTER
let veggiefilter = [
    "mit Geflügel",
    "mit Schwein",
    "mit Rind",
    "mit Fisch",
    ]

let everydayfilter = [
  "Pasta-Bar pro 100g",
  "Gemüse-Bar pro 100g",
  "Aus dem Suppentopf und Süßes"
]

const settingsScene = new Scene('settings')
settingsScene.enter((ctx) => ctx.replyWithMarkdown('*Einstellungen*\nWie kann ich dir helfen?', Markup
    .keyboard(['🍽 Mensa auswählen', 'Abbrechen']) //«
    .oneTime()
    .resize()
    .extra()
  ))

settingsScene.leave((ctx) => ctx.reply("Ich hoffe, jetzt ist alles recht so. Wenn nicht, frag mich einfach nochmal!", Extra.markup(Markup.removeKeyboard())))
settingsScene.hears('Abbrechen', leave())

settingsScene.hears('🍽 Mensa auswählen', (ctx) => ctx.reply('Wie möchtest du deine Mensa wählen?', Markup
    .keyboard([Markup.locationRequestButton('📍 Standort senden')/*, '🔎 Per Name suchen'*/]) //«
    .oneTime()
    .resize()
    .extra()
  ))

settingsScene.on('location', (ctx) => {


  request('http://openmensa.org/api/v2/canteens?near[lat]='+ctx.message.location.latitude+'&near[lng]=' + ctx.message.location.longitude, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var results = [];
        _.each(JSON.parse(body), function(element) {
          results.push(element.name + " #" + element.id)
        })

        ctx.reply('Ich habe diese Mensen in der Nähe (10km) gefunden. Welche ist deine?', Markup
            .keyboard(results) //«
            .oneTime()
            .resize()
            .extra()
          )

     }
  })

})
settingsScene.hears('🔎 Per Name suchen', enter('settings-searchbyname'))

settingsScene.hears(/(.+)#(\d+)/gm, (ctx) => {

  if(db.get('users')
  .find({ user_id: ctx.from.id })
  .value() === undefined) {
    db.get('users')
      .push({
        user_id: ctx.from.id,
        mensa_id: ctx.match[2]
       })
       .write()
  } else {
    db.get('users')
     .find({ user_id: ctx.from.id })
     .assign({
       mensa_id: ctx.match[2]
     })
     .write()
  }
  ctx.replyWithMarkdown("_" + ctx.match[1] + "_ ist jetzt als deine Mensa gesetzt.\nSieh dir deinen Speiseplan mit /today an.", Extra.markup(Markup.removeKeyboard()))


  leave()

})

settingsScene.hears("🥕", (ctx) => {
  if(db.get('users')
  .find({ user_id: ctx.from.id })
  .value() === undefined) {
    db.get('users')
      .push({
        user_id: ctx.from.id,
        veggiefilter: true,
        veganfilter: false
       })
       .write()
  } else {
    db.get('users')
      .find({ user_id: ctx.from.id })
      .assign({
        veggiefilter: true,
        veganfilter: false
       })
       .write()
  }

  ctx.replyWithMarkdown("Du hast den ultrageheimen Veggie-Filter aktiviert.", Extra.markup(Markup.removeKeyboard()))

  leave()
})

settingsScene.hears("🌴", (ctx) => {
  if(db.get('users')
  .find({ user_id: ctx.from.id })
  .value() === undefined) {
    db.get('users')
      .push({
        user_id: ctx.from.id,
        veganfilter: true
       })
       .write()
  } else {
    db.get('users')
      .find({ user_id: ctx.from.id })
      .assign({
        veganfilter: true
       })
       .write()
  }

  ctx.replyWithMarkdown("Die Veganer-Polizei überwacht jetzt diesen Speiseplan..", Extra.markup(Markup.removeKeyboard()))

  leave()
})

settingsScene.hears("🐖", (ctx) => {
  if(db.get('users')
  .find({ user_id: ctx.from.id })
  .value() === undefined) {
    db.get('users')
      .push({
        user_id: ctx.from.id,
        veggiefilter: false
       })
       .write()
  } else {
    db.get('users')
      .find({ user_id: ctx.from.id })
      .assign({
        veggiefilter: false
       })
       .write()
  }

  ctx.replyWithMarkdown("Du hast den ultrageheimen Veggie-Filter deaktiviert.", Extra.markup(Markup.removeKeyboard()))

  leave()
})




settingsScene.hears("🔄🚫", (ctx) => {
  if(db.get('users')
  .find({ user_id: ctx.from.id })
  .value() === undefined) {
    db.get('users')
      .push({
        user_id: ctx.from.id,
        everydayfilter: true
       })
       .write()
  } else {
    db.get('users')
      .find({ user_id: ctx.from.id })
      .assign({
        everydayfilter: true
       })
       .write()
  }

  ctx.replyWithMarkdown("Du hast den ultrageheimen tägliche-Gerichte-Filter aktiviert.", Extra.markup(Markup.removeKeyboard()))

  leave()
})

settingsScene.hears("🔄", (ctx) => {
  if(db.get('users')
  .find({ user_id: ctx.from.id })
  .value() === undefined) {
    db.get('users')
      .push({
        user_id: ctx.from.id,
        everydayfilter: false
       })
       .write()
  } else {
    db.get('users')
      .find({ user_id: ctx.from.id })
      .assign({
        everydayfilter: false
       })
       .write()
  }

  ctx.replyWithMarkdown("Du hast den ultrageheimen tägliche-Gerichte-Filter deaktiviert.", Extra.markup(Markup.removeKeyboard()))

  leave()
})

const settingsScene_searchByName = new Scene('settings-searchbyname')
//settingsScene_searchByName.enter((ctx) => ctx.reply("Hallo?"))
settingsScene_searchByName.on('message', (ctx) => {
  ctx.telegram.sendCopy(ctx.from.id, ctx.message)
  leave()
})
settingsScene_searchByName.leave((ctx) => ctx.reply("Suche beendet."))


const stage = new Stage([settingsScene, settingsScene_searchByName], { ttl: 100 })
bot.use(session())
bot.use(stage.middleware())
bot.command('settings', enter('settings'))

bot.command('today', (ctx) => {
  if(db.get('users').find({ user_id: ctx.from.id }).value() !== undefined) {
    let obj = db.get('users').find({ user_id: ctx.from.id }).value()

    getMensaPlan(ctx, obj, false)


  } else {
    ctx.reply("Du hast noch keine Mensa eingestellt. Benutze /settings zum einstellen der Mensa.")
  }
})

bot.action('notes', (ctx) => {

  if(db.get('users').find({ user_id: ctx.from.id }).value() !== undefined) {
    let obj = db.get('users').find({ user_id: ctx.from.id }).value()

    getMensaPlan(ctx, obj, true)


  } else {
    ctx.editMessageText("Du hast noch keine Mensa eingestellt. Benutze /settings zum einstellen der Mensa.")
  }

})


bot.on('message', (ctx) => ctx.reply('Befehl nicht verstanden. Benutze /settings oder /today'))
bot.startPolling()


// funcs
function getMensaPlan(ctx, obj, notes = false) {
  let now = new Date();
  let date = now.toISOString().slice(0,10);


  // Open Mensa request
  request('http://openmensa.org/api/v2/canteens/' + obj.mensa_id + '/days/' + date + "/meals", function (error, response, body) {
    if (!error && response.statusCode == 200) {
      let response = "Heute gibt es in deiner Mensa:\n"

      let last_category = ""
      let count = 0
      _.each(JSON.parse(body), function(meal) {

        if(obj.veggiefilter) {
          if(veggiefilter.some(r => meal.notes.includes(r))) {
            return
          }
        }

        if(obj.everydayfilter) {
          if(everydayfilter.some(r => meal.category == r)) {
            return
          }
        }

        if(obj.veganfilter) {
          if(!meal.notes.includes("Vegan")) {
            return
          }
        }


        if(last_category != meal.category) {
          response += "\n*" + meal.category + "*\n"
          last_category = meal.category
        }
        response += meal.name + "\n"

        if(notes) {
          response += "_(" + meal.notes.join(", ") + ")_\n"
        }

        response += meal.prices.students.toFixed(2) + "€\n\n"

        count++
      })


      if(count == 0) {
        response += "\nLeider gibt es heute nichts in deiner Mensa.\n(Überprüfe evtl. deine Filtereinstellungen)"
      }

      if(notes)
        ctx.editMessageText(response, Extra.markdown())
      else
        ctx.reply(response, Extra.markdown().markup((m) =>
          m.inlineKeyboard([
            m.callbackButton('Inhaltsstoffe anzeigen', 'notes')
          ])))
    }
  })
}
