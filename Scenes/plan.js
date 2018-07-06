module.exports = function(app) {

  const Scene = require('telegraf/scenes/base')
  const Extra = require('telegraf/extra')
  const _ = require('lodash');
  const request = require('request');

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

  const plan = new Scene('plan')

  plan.command('exit', app.leave())

  plan.enter((ctx) => {

    //Check if user exists in database
    if(app.db.get('users').find({ user_id: ctx.from.id }).value() !== undefined) {
      let obj = app.db.get('users').find({ user_id: ctx.from.id }).value()

      console.log('sendplan')
      sendPlan(obj, ctx, ctx.session.showNotes)

      // Reset any one-time filters
      ctx.session.showNotes = false

    } else {
      ctx.reply("Du hast noch keine Mensa eingestellt. Benutze /settings zum einstellen der Mensa.")
    }

    ctx.scene.leave()
  })

  //plan.leave((ctx) => ctx.reply("Beendet."))

  // HELPER FUNCTIONS
  function sendPlan(obj, ctx, notes = false, filter = [], date = new Date()) {
    console.log(notes)
    date = date.toISOString().slice(0,10);


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

  return plan
}