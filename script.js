document.addEventListener('DOMContentLoaded', function () {

    var mapInitialized = false;
    var map; 
    var markersAdded = false; // Flag to track whether markers have been added
    var mqttHostInput = document.getElementById('mqtt-host');
    var mqttPortInput = document.getElementById('mqtt-port');
    var startButton = document.getElementById('startButton');
    var endButton = document.getElementById('endButton');
    var shareStatusButton = document.getElementById('shareStatusButton');
    var courseCode = "ENGO551"; 
    var yourName = "Julian";
    var marker = null;
    var mqttClient;



    startButton.addEventListener('click', function() {
        mqttBrokerHost = mqttHostInput.value;
        mqttBrokerPort = parseInt(mqttPortInput.value); 
        connectToMQTT();
    });
    
    endButton.addEventListener('click', function() {
        console.log("mqttClient in shareStatusButton:", mqttClient);
       if (mqttClient && mqttClient.isConnected()) {
           mqttClient.disconnect(); 
       }
    }); 

    shareStatusButton.addEventListener('click', function() {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(function (position) {
            const temperature = Math.random() * 60 - 40; // Simulated 
            const geoJSON = {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [position.coords.longitude, position.coords.latitude]
              },
              properties: {
                temperature: temperature
              }
            };
      
            // Ensure mqttClient is connected before sending a message
            if (mqttClient && mqttClient.isConnected()) {
              const message = new Paho.MQTT.Message(JSON.stringify(geoJSON));
              message.destinationName = "ENGO551/Julian/my_temperature";
              mqttClient.send(message);
      
              updateMapMarker(position.coords.latitude, position.coords.longitude, temperature); 
            } else {
              console.error("MQTT client not connected. Please connect first.");
            }
          }, function(error) {
            console.error("Geolocation error:", error);
          });
        } else {
          console.error("Geolocation not supported");
        }
      });

    shareStatusButton.addEventListener('click', function() {
        const topic = document.getElementById('mqtt-topic').value;
        const messageText = document.getElementById('mqtt-message').value;
    
    });

    // Setting the Map view to Calgary
    map = L.map('map').setView([51.0447, -114.0719], 10.5);

    // initializeMapMarker(); 

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

   function connectToMQTT() {

       var mqttBrokerHost = document.getElementById('mqtt-host').value; // Get the input value
       var mqttBrokerPort = parseInt(document.getElementById('mqtt-port').value); // Parse port 

         console.log("mqttBrokerHost:", mqttBrokerHost);
         console.log("mqttBrokerPort:", mqttBrokerPort);

         if (mqttClient && mqttClient.isConnected()) { 
            console.log("MQTT client already connected");
            return;
        }
       
       mqttClient = new Paho.MQTT.Client(mqttBrokerHost, mqttBrokerPort,  `clientId_${new Date().getTime()}`); 


        mqttClient.onConnect = function() {
         console.log("MQTT client connected successfully");
        }

        mqttClient.onConnectionLost = function(responseObject) {
         console.error("MQTT client connection lost:", responseObject.errorMessage);
         }

       mqttClient.onConnectionLost = onConnectionLost;
       mqttClient.onMessageArrived = onMessageArrived;

       mqttClient.connect({
        onSuccess: onConnect,
        onFailure: onLost,
        useSSL: true
       });

   }

   function publishMessage() {
    var topic = document.getElementById('publish_topic').value;
    var messageContent = document.getElementById('publish_message').value;

    if (!topic) {
        alert("Please enter a topic.");
        return;
    }

    var message = new Paho.MQTT.Message(messageContent);
    message.destinationName = topic;
    mqttClient.send(message);
}

document.getElementById('publish').addEventListener('click', publishMessage);

   function onConnect() {
       console.log("Connected to MQTT broker");
       mqttClient.subscribe("ENGO551/Julian/my_temperature");
   }

    // function to show cant connect, and connections lost
   function onLost(errorMessage) {
    console.log("Could not connect " + errorMessage.errorMessage);
   }


   function onConnectionLost(response) {
    console.error("MQTT connection lost:", response);

    // Retry with a delay
    setTimeout(function() {
        console.log("Attempting to reconnect to MQTT...");
        connectToMQTT(); 
    }, 3000); // 3-second delay before retry 
}

   function onMessageArrived(message) {
    console.log("MQTT Message Payload:", message.payloadString); // Log the raw payload

    const locationData = JSON.parse(message.payloadString);
    console.log("Parsed locationData:", locationData);        // Log the parsed data
    updateMapMarker(locationData.latitude, locationData.longitude, locationData.temperature); 

    if (!markersAdded) { 
        markersAdded = true; // Only set this flag once.
    }
        }

function updateMapMarker(latitude, longitude, temperature) {
    console.log("updateMapMarker called with:", latitude, longitude, temperature);  
    console.log("markersAdded before:", markersAdded);
    marker = L.marker([latitude, longitude]).addTo(map);
    marker.bindPopup(`Temperature: ${temperature}`);
    console.log("marker:", marker)
    map.panTo([latitude, longitude]); 
    updateMarkerColor(marker, temperature); 
    console.log("markersAdded after:", markersAdded);
}

function updateMarkerColor(marker, temperature) {
    let color;
    if (temperature < 10) {
        color = 'blue';
    } else if (temperature < 30) {
        color = 'green';
    } else {
        color = 'red';
    }
    const newIcon = L.icon({ 
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
        iconSize: [25, 41],
        iconAnchor: [12, 41] 
    });
    marker.setIcon(newIcon);  
}

function initializeMapMarker() { 
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            updateMapMarker(position.coords.latitude, position.coords.longitude, 0); // Initial temperature can be 0
        });
    } else {
        console.error("Geolocation not supported");
    }
}



   function publishLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var message = new Paho.MQTT.Message(JSON.stringify({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            }));
            message.destinationName = mqttTopic;
            mqttClient.send(message);
        }, function (error) {
            console.error("Error getting location:", error);
        });
    } else {
        console.error("Geolocation not supported");
    }



    
}




})
