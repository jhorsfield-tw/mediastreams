require('dotenv').load();
const sync = require('./sync.js');

const language = require('@google-cloud/language');
const lang = new language.LanguageServiceClient();
const client = require('twilio')(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);
const hotwords = ['fever', 'headache', 'sprained ankle', 'high temperature'];


async function natLang(sid, data){    
    let callerID = await getCallID(sid);
    const document = {
        content: data,
        type: 'PLAIN_TEXT',
      };

    const [result] = await lang.analyzeEntities({document});
    const entities = result.entities;
    console.log('Entities:');
    entities.forEach(entity => {
        console.log(entity.name);
        console.log(` - Type: ${entity.name}, Salience: ${entity.salience}`);
        if(hotwords.findIndex(symptom => symptom === entity.name) >= 0){
            sync.syncCheck(callerID, entity.name);
            console.log('Matched hotword');
        }
  });

}

function getCallID(sid){
    return new Promise(function(resolve, reject){
    client.calls(sid)
      .fetch()
      .then(call => {
          console.log('THis is the caller ID: '+call.from);
          resolve(call.from);
      })
      .catch(err => {
          console.log('THis is the error with the call sid: '+err);
          reject('Failed')
      })
    })
}

module.exports.natLang = natLang;