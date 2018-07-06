module.exports = function(app) {

  // http://openmensa.org/api/v2/canteens?page=10
  const request = require('request');
  const _ = require('lodash');

  app.db.set('canteens', [])
  .write()

  for (var page=0; page<10; page++)
  request('http://openmensa.org/api/v2/canteens?limit=100&page='+page, function (error, response, body) {

    _.each(JSON.parse(body), function(e) {
      let c = {
        id: e.id,
        name: e.name,
        city: e.city
      }

      app.db.get('canteens')
      .push(c)
      .write()

    })


  })





}
