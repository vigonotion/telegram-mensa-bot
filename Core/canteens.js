module.exports = function(app) {

  // http://openmensa.org/api/v2/canteens?page=10
  const fetch = require('node-fetch');
  const _ = require('lodash');

  app.db.set('canteens', [])
  .write()

  for (var page=0; page<10; page++) {

    fetch('http://openmensa.org/api/v2/canteens?limit=100&page='+page)
      .then(res => res.json())
      .then(json => {
        _.each(json, function(e) {

          let name = (e.name === undefined) ? "" : e.name.trim()
  
          let c = {
            id: e.id,
            name: name,
            city: e.city
          }
  
          app.db.get('canteens')
          .push(c)
          .write()
  
        })

      });

      
  }
}