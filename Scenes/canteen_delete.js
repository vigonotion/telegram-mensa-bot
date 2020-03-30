module.exports = function (app) {
  const Scene = require("telegraf/scenes/base");
  const _ = require("lodash");
  const Markup = require("telegraf/markup");
  const Extra = require("telegraf/extra");

  const canteen_delete = new Scene("canteen_delete");

  canteen_delete.enter((ctx) => fn_delete_canteen(ctx));

  canteen_delete.hears("Abbrechen", app.leave());

  canteen_delete.hears(/(.+)#(\d+)/gm, (ctx) => {
    if (
      app.db.get("users").find({ user_id: ctx.from.id }).value() !== undefined
    ) {
      app.db
        .get("users")
        .find({ user_id: ctx.from.id })
        .get("canteens")
        .pull(parseInt(ctx.match[2]))
        .write();
    }
    ctx.replyWithMarkdown(
      "_" + ctx.match[1] + "_ wurde von deinen aktiven Mensen entfernt.",
      Extra.markup(Markup.removeKeyboard())
    );

    ctx.scene.leave();
  });

  canteen_delete.on("message", (ctx) => fn_delete_canteen(ctx));

  function fn_delete_canteen(ctx) {
    let user_canteens = app.db
      .get("users")
      .find({ user_id: ctx.from.id })
      .get("canteens")
      .value();

    let rawRes = app.db
      .get("canteens")
      .filter(function (c) {
        return _.includes(user_canteens, c.id);
      })
      .value();

    let results = [];
    _.each(rawRes, function (element) {
      results.push(element.name + " #" + element.id);
    });
    results.push("Abbrechen");

    ctx.reply(
      "Welche Mensa möchtest du entfernen?",
      Markup.keyboard(results) //«
        .oneTime()
        .resize()
        .extra()
    );
  }

  return canteen_delete;
};
