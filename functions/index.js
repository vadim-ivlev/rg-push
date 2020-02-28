const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

exports.sendNotifications = functions.database.ref('/notifications/{notificationId}').onWrite((event) => {

    console.info("event.data")
    console.info(event)
  // Exit if data already created
//   if (event.data.previous.val()) {
//     return;
//   }

  // Exit when the data is deleted
//   if (!event.data.exists()) {
//     return;
//   }


      // Only edit data when it is first created.
      if (event.before.exists()) {
        return null;
      }
      // Exit when the data is deleted.
      if (!event.after.exists()) {
        return null;
      }

  // Setup notification
//   const NOTIFICATION_SNAPSHOT = event.data;
  const NOTIFICATION_SNAPSHOT = event.after;
  const payload = {
    notification: {
      title: `New Message from ${NOTIFICATION_SNAPSHOT.val().user}!`,
      body: NOTIFICATION_SNAPSHOT.val().message,
      icon: NOTIFICATION_SNAPSHOT.val().userProfileImg,
      click_action: `https://aaaaaa.com`// `https://${functions.config().firebase.authDomain}`
    }
  }

  console.log("payload--------------------------------------")
  console.log(payload)

  // Clean invalid tokens
  function cleanInvalidTokens(tokensWithKey, results) {

    console.log("cleanInvalidTokens============================")
    console.log("tokensWithKey++++++++++++++++++++++++++++++++")
    console.log(tokensWithKey)
    console.log("results------++++++++++++++++++++++++++++++++")
    console.log(results)
    // return
    //------------------------------- debug stop here --------------------------

    const invalidTokens = [];

    results.forEach((result, i) => {
      if ( !result.error ) return;

      console.error('Failure sending notification to', tokensWithKey[i].token, result.error);
      
      switch(result.error.code) {
        case "messaging/invalid-registration-token":
        case "messaging/registration-token-not-registered":
          invalidTokens.push( admin.database().ref('/tokens').child(tokensWithKey[i].key).remove() );
          break;
        default:
          break;
      }
    });

    return Promise.all(invalidTokens);
  }


  return admin.database().ref('/tokens').once('value').then((data) => {
    
    if ( !data.val() ) return;

    const snapshot = data.val();
    const tokensWithKey = [];
    const tokens = [];

    for (let key in snapshot) {
      tokens.push( snapshot[key].token );
      tokensWithKey.push({
        token: snapshot[key].token,
        key: key
      });
    }

    console.log("tokens--------------------------------------")
    console.log(tokens)
  

    return admin.messaging().sendToDevice(tokens, payload)
        .then((response) => {
            console.log("sendToDevice response ********************************************************************")
            console.log(response)
            cleanInvalidTokens(tokensWithKey, response.results)
        })
        .then(() => {
            admin.database().ref('/notifications').child(NOTIFICATION_SNAPSHOT.key).remove()
            console.log("DONEDONE-------------------------------")  
        })
        .catch((err) =>{
                console.error("EEEEEEEEEEEEEEEEEEEEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRr")
                console.error(err)
        })
  });


});


// Handle incoming messages. Called when:
  // - a message is received while the app has focus
  // - the user clicks on an app notification created by a service worker
  //   `messaging.setBackgroundMessageHandler` handler.
  messaging.onMessage((payload) => {
    console.log('Message received. ', payload);
    // [START_EXCLUDE]
    // Update the UI to include the received message.
    // appendMessage(payload);
    // [END_EXCLUDE]
  });