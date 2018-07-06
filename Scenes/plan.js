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

      sendPlan(obj, ctx, ctx.session.showNotes, !ctx.session.showAll, ctx.session.editLast)

      // Reset any one-time filters
      ctx.session.showNotes = false
      ctx.session.showAll = false
      ctx.session.editLast = false

    } else {
      ctx.reply("Du hast noch keine Mensa eingestellt. Benutze /settings zum einstellen der Mensa.")
    }

    ctx.scene.leave()
  })

  //plan.leave((ctx) => ctx.reply("Beendet."))

  // HELPER FUNCTIONS
  function sendPlan(obj, ctx, notes = false, filter = true, editLast = false, date = new Date()) {
    date = date.toISOString().slice(0,10);

    let mealcount = 0

    // Open Mensa request
    request('http://openmensa.org/api/v2/canteens/' + obj.mensa_id + '/days/' + date + "/meals", function (error, response, body) {
      if (!error && response.statusCode == 200) {
        let response = "Heute gibt es in deiner Mensa:\n"
        let result = JSON.parse(body)

        let last_category = ""
        let mealcount = result.length
        let filteredcount = 0
        _.each(result, function(meal) {

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

        function keyboard(m, notes = true, more = false, morecount = 0) {
          keyboards = []
          if(notes) keyboards.push(m.callbackButton('Inhaltsstoffe anzeigen', 'notes'))
          if(more)  keyboards.push(m.callbackButton(morecount + ' weitere anzeigen', 'unfiltered'))
          return keyboards
        }

        if(filteredcount == 0 && mealcount > 0) {

          if(editLast)
            ctx.editMessageText(response, Extra.markdown().markup((m) => m.inlineKeyboard(keyboard(m))))
          else
            ctx.reply(response, Extra.markdown().markup((m) => m.inlineKeyboard(keyboard(m, false, true, mealcount))))

        } else if(filteredcount < mealcount) {
          let diff = mealcount - filteredcount

          if(editLast)
            ctx.editMessageText(response, Extra.markdown().markup((m) => m.inlineKeyboard(keyboard(m, !notes, true, diff))))
          else
            ctx.reply(response, Extra.markdown().markup((m) => m.inlineKeyboard(keyboard(m, true, true, diff))))

        } else {
          if(editLast)
            ctx.editMessageText(response, Extra.markdown().markup((m) => m.inlineKeyboard(keyboard(m, false))))
          else
            ctx.reply(response, Extra.markdown().markup((m) => m.inlineKeyboard(keyboard(m))))
        }


      }
    })

  }

  return plan
}
