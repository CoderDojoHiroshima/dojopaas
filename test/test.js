var sacloud = require('sacloud');
var fs = require('fs');
var csv = require('comma-separated-values');
var Server = require('../lib/Server');

var defaultTag = 'dojopaas'

/// サンドボックス
var zone = "29001";
var api = "https://secure.sakura.ad.jp/cloud/zone/tk1v/api/cloud/1.1/"

var plan = "1001" // 1コア、1GBメモリ

var packetfilterid = '112900927419' // www

const config = {
  disk: {
    Plan: { ID: 4 },
    SizeMB: 20480,
    SourceArchive: { ID: "112900758037" }
  }
}

sacloud.API_ROOT = api;
var client = sacloud.createClient({
  accessToken        : process.env.SACLOUD_ACCESS_TOKEN,
  accessTokenSecret  : process.env.SACLOUD_ACCESS_TOKEN_SECRET,
  disableLocalizeKeys: false, // (optional;default:false) false: lower-camelize the property names in response Object
  debug              : false // (optional;default:false) output debug requests to console.
});

Promise.resolve()
.then(() => {
  return new Promise((resolve, reject) => {
    client.createRequest({
      method: 'GET',
      path  : 'server',
      body  : {
        Filter: {
          "Tags": defaultTag
        }
      }
    }).send((err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
}).then((data) => {
  for (var i=0; i<data.response.servers.length; i++) {
    var server = new Server(client);
    server.destroy(data.response.servers[i].id)
  }
  return new Promise((resolve, reject) => {
    var server = new Server(client);
    server.create({
      zone: zone,
      plan: plan,
      packetfilterid: packetfilterid,
      name: "test",
      description: "This is a instance for test",
      tags: [defaultTag],
      pubkey: "xxxx",
      disk: config.disk,
      resolve: resolve
    })
  })
}).then((data) => {
  client.createRequest({
    method: 'GET',
    path  : 'server/'+data,
  }).send((err, result) => {
    if (err) throw new Error(err);
    if ('up' === result.response.server.instance.status) {
      console.log('OK')
    } else {
      throw new Error('Can not start Instance!');
    }
  });
}).catch((err) => {
  throw new Error(err);
})
