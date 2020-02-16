require ('dotenv').load();
const client = require('twilio')(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);
const syncSID = process.env.SYNC_SERVICE_SID;

exports.syncCheck = async function(num, hotword, res){
    let checker = await syncListCheck(num, hotword);
    if (checker === 'mapFound'){
        //now run the fetch to see if I have the hotword already
        let syncFetcher = await syncFetch(num, hotword);
            if (syncFetcher === 'item') {
                console.log('Found item in sync map already so nothing more needs to be done');
                return;
            }
            else {
                //hotword doesn't exist I need to create it
                let syncAdder = syncAdd(num, hotword);
            }        
    } else if (checker === 'noMap'){
        //this has gone a bit wrong, shouldn't be possible to not have a SyncMap.....
        return;
    } else {
        //The lookup failed so exit
        return;
    }

}

exports.syncDelete = async function(num){
    console.log('In the delete sync map function');
    let callID = await getCallID(num)
    if (callID === 'failed'){
        console.log('The callID lookup has failed, cannot progress');
        return;
    }
    let syncDelete = await syncDel(callID);
    return;
}


//check if there is a list already for this number
function syncListCheck(listName, hotword){
    return new Promise(function(resolve, reject){
        client.sync.services(syncSID)
        .syncMaps(listName)
        .fetch()
        .then(sync_map => {
            if(sync_map.sid){
                console.log('Found a Sync map for this number: '+sync_map.sid);
                resolve('mapFound');
            }
            console.log('Successfully ran the sync map check, no list found though');
            resolve('noMap');            
        })
        .catch(err => {
            console.log('This is the error in syncList check: '+err);
            reject('Failed');
        })
    })
}

//if list update with the new value
function syncFetch(listName, value){
    return new Promise(function(resolve, reject){
        client.sync.services(syncSID)
        .syncMaps(listName)
        .syncMapItems
        .list({limit: 5})
        .then(sync_map_items => {
              sync_map_items.forEach(s => {
                  if(s.key === value){
                      console.log('Found the key already: '+s.key);
                      resolve('item')
                  }                 
              });
              resolve('no_item');     
        })
        .catch(err => {
            console.log('This is the error with the sync map fetch: '+err);
            resolve('item_failed');
        })
    })
}


//if no list create one and add in the value
function syncAdd(listName, value){
    return new Promise(function (resolve, reject){
        client.sync.services(syncSID)
        .syncMaps(listName)
        .syncMapItems
        .create({key: value, data:{'status': 'true'}})
        .then(sync_map_item => {
            console.log('Sync map item successfully created, here is the SID: '+sync_map_item.key);
            resolve('success');
        })
        .catch(err => {
            console.log('This is the error in the creation of the sync map item: '+err);
            reject('failed');
        })
    })
}

//delete list
function syncDel(num){
    return new Promise(function(resolve, reject){
        client.sync.services(syncSID)
        .syncMaps(num)
        .remove()
        .then(sync_map => {
            console.log('The sync map has been successfully removed, sid is: '+sync_map.sid);
            resolve('deleted');
        })
        .catch(err => {
            console.log('The sync map delete has failed, reason is: '+err);
            reject('failed');
        })
    })
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
          reject('failed')
      })
    })
}

