require('dotenv').config({path: __dirname + '/.env'})

const Telegraf = require("telegraf")
const session = require('telegraf/session')
const Stage = require('telegraf/stage')

const { enter, leave } = Stage

const bot = new Telegraf(process.env.BOT_TOKEN);

// Database
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync(__dirname + '/Database/db.json')
const db = low(adapter)

// Set some defaults (required if your JSON file is empty)
db.defaults({ users: [] })
  .write()

// App Object
let app = {
  db: db,
  enter: enter,
  leave: leave
}

//bot.use(Telegraf.log())

require('./Core/canteens.js')(app);


let scene_settings = require('./Scenes/settings.js')(app);
let scene_search = require('./Scenes/search.js')(app);
let scene_canteen_delete = require('./Scenes/canteen_delete.js')(app);
let scene_plan = require('./Scenes/plan.js')(app);



const stage = new Stage([scene_settings, scene_search, scene_canteen_delete, scene_plan], { ttl: 100 })
bot.use(session())
bot.use(stage.middleware())

bot.command('start', (ctx) => {
  ctx.reply("Willkommen beim Mensa-Bot! Beginne, in dem du /settings aufrufst, um deine Mensa auszuwählen.")
})

// settings
bot.command('settings', enter('settings'))

// plan
bot.command('today', (ctx) => {
  ctx.session.editLast = false
  ctx.scene.enter('plan')
})

bot.action('notes', (ctx) => {
  ctx.session.editLast = true
  ctx.session.showNotes = true
  ctx.scene.enter('plan')
})
bot.action('unfiltered', (ctx) => {
  ctx.session.editLast = true
  ctx.session.showAll = true
  ctx.scene.enter('plan')
})
bot.action('next_canteen', (ctx) => {
  ctx.session.currentCanteen = ctx.session.currentCanteen || 0
  ctx.session.currentCanteen++

  ctx.session.editLast = true
  ctx.session.showNotes = false
  ctx.session.showAll = false
  ctx.scene.enter('plan')
})
bot.action('last_canteen', (ctx) => {
  ctx.session.currentCanteen = ctx.session.currentCanteen || 0
  ctx.session.currentCanteen--

  ctx.session.editLast = true
  ctx.session.showNotes = false
  ctx.session.showAll = false
  ctx.scene.enter('plan')
})
bot.on('message', (ctx) => ctx.reply('Befehl nicht verstanden. Benutze /settings oder /today'))

bot.startPolling()
