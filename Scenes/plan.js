module.exports = function(app) {

  const Scene = require('telegraf/scenes/base')
  const Extra = require('telegraf/extra')
  const _ = require('lodash');
  const fetch = require('node-fetch');

  /// HIDDEN VEGGIE FILTER
  let veggiefilter = [
      "mit Geflügel",
      "mit Schwein",
      "mit Rind",
      "mit Fisch",
      "Krebstier(e)/-erzeugnisse"
      ]

  let everydayfilter = [
    "Pasta-Bar pro 100g",
    "Gemüse-Bar pro 100g",
    "Aus dem Suppentopf und Süßes"
  ]

  const plan = new Scene('plan')

  plan.command('exit', app.leave())

  plan.enter((ctx) => {

    //Check if user exists in database
    let obj = app.db.get('users').find({ user_id: ctx.from.id }).value()
    if(obj !== undefined && obj.canteens.length > 0) {

      sendPlan(obj, ctx, ctx.session.showNotes, !ctx.session.showAll, ctx.session.editLast)

      // Reset any one-time filters
      // ctx.session.editLast = false
      // ctx.session.showNotes = false
      // ctx.session.showAll = false

    } else {
      ctx.reply("Du hast noch keine Mensa eingestellt. Benutze /settings zum einstellen der Mensa.")
    }

    ctx.scene.leave()
  })

  //plan.leave((ctx) => ctx.reply("Beendet."))

  function getCanteen(id) {
    return app.db.get('canteens').find({ id: id }).value()
  }

  // HELPER FUNCTIONS

  function modulo(a,n) {
    return a - (n * Math.floor(a/n))
  }

  function sendPlan(obj, ctx, notes = false, filter = true, editLast = false, date = new Date()) {
    date = date.toISOString().slice(0,10);

    if(ctx.session.currentCanteen === undefined) ctx.session.currentCanteen = 0
    ctx.session.currentCanteen = modulo(ctx.session.currentCanteen, obj.canteens.length)
    let canteen_id = obj.canteens[ctx.session.currentCanteen]

    let canteen = getCanteen(canteen_id)
    let canteen_name = (canteen !== undefined) ? canteen.name : ""

    // Open Mensa request

    fetch('http://openmensa.org/api/v2/canteens/' + canteen_id + '/days/' + date + '/meals')
      .then(res => res.json())
      .then(json => {
          let response = "Heute gibt es in der Mensa *" + canteen_name + "*:\n"

          let last_category = ""
        let mealcount = json.length
        let filteredcount = 0
        _.each(json, function(meal) {

          if(filter && obj.veggiefilter) {
            if(veggiefilter.some(r => meal.notes.includes(r))) {
              return
            }
          }

          if(filter && obj.everydayfilter) {
            if(everydayfilter.some(r => meal.category == r)) {
              return
            }
          }

          if(filter && obj.veganfilter) {
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

          filteredcount++
        })


        if(filteredcount == 0) {
          response += "\nLeider gibt es heute nichts in deiner Mensa.\n(Überprüfe evtl. deine Filtereinstellungen)"
        }

        function keyboard(m, show_canteen_nav = false, notes = true, more = false, morecount = 0) {
          keyboards = []
          canteen_nav = [m.callbackButton('« Vorherige Mensa', 'last_canteen'), m.callbackButton('Nächste Mensa »', 'next_canteen')]
          if(notes) keyboards.push(m.callbackButton('Inhaltsstoffe anzeigen', 'notes'))
          if(more)  keyboards.push(m.callbackButton(morecount + ' weitere anzeigen', 'unfiltered'))

          if(show_canteen_nav) return [canteen_nav, keyboards]
          return [keyboards]
        }

        let morecount = mealcount - filteredcount
        let md = Extra.markdown().markup((m) => m.inlineKeyboard(keyboard(m, obj.canteens.length > 1, !notes, morecount > 0, morecount)))

        if(editLast)
          ctx.editMessageText(response, md)
        else
          ctx.reply(response, md)

      });


  }

  return plan
}
