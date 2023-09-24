// Small icon from https://sites.google.com/site/gmapsdevelopment/

/* 
  Description
    This application implements a place (bar) crawl builder.
    Locations are searched, then laid out to be selected.
    Selected locations are then sequenced to find an efficient route to visit all of them.

  Overview of the Google map API system usage in this project
  - This map is generated and initialized using the older google map API (AdvancedMarker needs promises which I can't use yet)
  - A single map is placed on the webpage
  - markerlist = [] contains all the markers ever created on this page (until a refresh) 

  - A search can occur from 2 ways:
    a. User presses "search my location". The local user's browser location is used to search the area for the input keywords
    b. User presses "search map location". The map's center coordinates is used to search the area for the input keywords
    c. User selects an autocompleted search location. The map's center coordinates is then centered here.

  - Search results will be collected and displayed as a grid of cards.
    Each card has a select toggle.
    When the user selects the card toggle, the place is added to the destination list.

  - To create the place (bar) crawl, the user presses "Generate your crawl".
    The destination list will be saved into the localstore as the "waypoints" array.
    This will be used by the next page, result.html, to generate a minimum-distance route using its travelling salesman solver.
    (Consequently it is limited to 10000 iterations because the problem is n! complex and our computers has no power for large lists)
 */


var storagekey = "barconfig"; // localStorage name to load/save config
var barconfig = {
  latitude: 30.266666,
  longitude: -97.73333,
  radius: 5000,
  defaultsearchterm: "bar",
  units: "imperial",
  searchterm: "",
};

var unit_deg = {
  standard: "°K",
  metric: "°C",
  imperial: "°F",
};
var unit_dist = {
  standard: "m/s",
  metric: "m/s",
  imperial: "mph",
};

function configload() {
  let newdata = {};
  //console.log("loading from storage");
  newdata = JSON.parse(localStorage.getItem(storagekey));
  Object.assign(barconfig, newdata); // merge data from storage
  return true;
}

function configsave() {
  // Store data to localstorage
  //console.log("saving to storage");
  //console.log(this.pdata);
  localStorage.setItem(storagekey, JSON.stringify(barconfig));
  return true;
}

var barcardContainerEl = document.querySelector("#barcardcontainer");

var barcard = createElementFromHTML(
  `
  <div class="card bg-gray-900 text-white shadow-xl hover:opacity-90">
    <figure class="h-1/2 max-h-[50%]">
      <img
        src="./assets/images/wil-stewart-UErWoQEoMrc-unsplash.jpg"
        alt="Drinks"
        class="h-full w-full object-center object-cover"
      />
    </figure>
    <div class="card-body h-fit p-5">
      <h2 class="card-title">Drinks!</h2>
      <p>Find your drink!</p>
    </div>
    <div class="card-actions justify-end pr-2 pb-2">
        <input type="checkbox" class="toggle" />
    </div>
  </div>
  `
);

var barlist = [];

/*
var barlist = [
  {
    business_status: "OPERATIONAL",
    geometry: {
      location: {
        lat: 1.3015153,
        lng: 103.8391555,
      },
      viewport: {
        northeast: {
          lat: 1.302644279892722,
          lng: 103.8407376298927,
        },
        southwest: {
          lat: 1.299944620107278,
          lng: 103.8380379701073,
        },
      },
    },
    name: "Bar Name",
    image: "http://placekitten.com/200/300",
    opening_hours: {
      open_now: true,
    },
    place_id: "ChIJRZ1c0JYZ2jER3_UBKFcKgXA",
    plus_code: {
      compound_code: "8R2Q+JM Singapore",
      global_code: "6PH58R2Q+JM",
    },
    rating: 4.2,
    types: ["bar", "restaurant", "food"],
    user_ratings_total: 527,
  }
];
*/

var selectedbarlist = [];

/* This data structure can be saved into waypoints
var selectedbarlist = [
  {
    place_id: event.target.id,
    name: event.target.dataset.name,
    lat: event.target.dataset.lat,
    lng: event.target.dataset.lng
  }
];
 */

var markerlist = [];

// Create cards from html
function createElementFromHTML(htmlString) {
  var div = document.createElement("div");
  div.innerHTML = htmlString.trim();
  // Change this to div.childNodes to support multiple top-level nodes.
  return div.firstChild;
}

// Get weather from location
//   api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API key}
function getweather() {
  //let forecast = JSON.parse(testforecast);

  /* current weather
  let apilink =
    "https://api.openweathermap.org/data/2.5/weather?lat=" +
    barconfig.latitude +
    "&lon=" +
    barconfig.longitude +
    "&units=" +
    barconfig.units +
    "&appid=2baf085ed1bbea0d1b7d521e3687a9b9";
  */

  // forecast of tonight's weather
  let apilink =
    "https://api.openweathermap.org/data/2.5/forecast?lat=" +
    barconfig.latitude +
    "&lon=" +
    barconfig.longitude +
    "&units=" +
    barconfig.units +
    "&appid=" +
    myapikeys.openweather;

  fetch(apilink)
    .then(function (response) {
      if (response.ok) {
        // console.log("content for weather openweatherapi response :", response);
        response.json().then(function (data) {
          // console.log("json content for weather openweatherapi call: ", data);
          document.getElementById("cityname").textContent = " in " + data.city.name; // data.name for current weather
          barconfig.cityname = data.city.name; // set it as the default city name
          configsave();

          displayweather(data);
          return;
          // end parse openweathermap API response */
        });
      } else {
        alert("Error: " + response.statusText);
      }
    })
    .catch(function (error) {
      console.log("Error:", error);
    });

  function displayweather(weather) {
    var i = 0;
    var itemdate = new Date();
    var maxiteration = Math.min(weather.list.length, 9); // 8 3-hour intervals in the future
    if (itemdate.getHours() < 6) {
      // it's still considered tonight before 6 AM
      maxiteration = 1;
    }
    for (i = 0; i < maxiteration; i++) {
      itemdate = new Date(0);
      itemdate.setUTCSeconds(parseInt(weather.list[i].dt));
      w_isnight = itemdate.getHours() >= 18 || itemdate.getHours() < 6; // it's night after 6PM to 6AM
      // console.log(itemdate.getHours());
      if (w_isnight) {
        // tonight should be after 6pm or dark (assume local browser time)
        break;
      }
    }

    let ticon = weather.list[i].weather[0].icon;
    let wicon = "https://openweathermap.org/img/wn/" + ticon + "@2x.png";

    //console.log("tonight's weather:", weather);
    // transform: rotate(45deg);
    document.getElementById("tonightshour").textContent = itemdate.toLocaleTimeString("en-US");

    document.getElementById("todaysweathericon").classList.add("bg-black");
    document.getElementById("todaysweathericon").innerHTML = '<img src="' + wicon + '" class="w-[100px] h-[100px]"/>';
    document.getElementById("todaysweatherdescription").innerHTML = weather.list[i].weather[0].description;
    document.getElementById("todaysweatherdata").innerHTML =
      "🌡 " +
      weather.list[i].main.temp +
      unit_deg[barconfig.units] +
      " (feels like " +
      weather.list[i].main.temp +
      unit_deg[barconfig.units] +
      ")   🌢 " +
      weather.list[i].main.humidity +
      "% humidity<br>";

    document.getElementById("winddirection").style.transform = "rotate(" + weather.list[i].wind.deg + "deg)";

    var windgust = "";
    if (weather.list[i].wind.gust) {
      // check if defined
      windgust = " " + unit_dist[barconfig.units] + " (gust)";
    }
    var weatherspeed =
      "<p>⠀" + weather.list[i].wind.speed + " " + unit_dist[barconfig.units] + " (wind) " + windgust + "</p>";
    // console.log(weatherspeed);
    document.getElementById("todaysweatherspeed").innerHTML = weatherspeed;
  }
}

// Get current position of the user from browser
function geoFindMe() {
  const status = document.querySelector("#status");
  const mapLink = document.querySelector("#map-link");

  mapLink.href = "";
  mapLink.textContent = "";

  // Display user's position
  function success(position) {
    var latitude = position.coords.latitude;
    var longitude = position.coords.longitude;

    // Display user's position on an a href link
    status.textContent = "";
    mapLink.href = `https://www.openstreetmap.org/#map=11/${latitude}/${longitude}`;
    mapLink.textContent = `Latitude: ${latitude} °, Longitude: ${longitude} °`;

    // center main map
    map.setCenter(new google.maps.LatLng(latitude, longitude));

    barconfig.latitude = latitude;
    barconfig.longitude = longitude;

    getweather();

    // Search from the default search term
    var searchterm = document.getElementById("whattosearch").value.trim();
    if (searchterm.length === 0) {
      searchterm = barconfig.defaultsearchterm;
    }
    barconfig.searchterm = searchterm;
    configsave();
    getGoogleSearch(searchterm);
  }

  function error() {
    status.textContent = "Unable to retrieve your location";
  }

  if (!navigator.geolocation) {
    status.textContent = "Geolocation is not supported by your browser";
  } else {
    status.textContent = "Locating…";
    navigator.geolocation.getCurrentPosition(success, error);
  }
}
// END Get current position of the user from browser

// Get current position of the user from map
function geoFindMap() {
  const status = document.querySelector("#status");
  const mapLink = document.querySelector("#map-link");

  mapLink.href = "";
  mapLink.textContent = "";

  var latlng = map.getCenter();
  var latitude = latlng.lat();
  var longitude = latlng.lng();

  // Display user's position on an a href link
  status.textContent = "";
  mapLink.href = `https://www.openstreetmap.org/#map=11/${latitude}/${longitude}`;
  mapLink.textContent = `Latitude: ${latitude} °, Longitude: ${longitude} °`;

  barconfig.latitude = latitude;
  barconfig.longitude = longitude;

  getweather();

  // Search from the default search term
  var searchterm = document.getElementById("whattosearch").value.trim();
  if (searchterm.length === 0) {
    searchterm = barconfig.defaultsearchterm;
  }
  barconfig.searchterm = searchterm;
  configsave();
  getGoogleSearch(searchterm);
}
// END search Map's center position

//
function displayGooglePlace(data) {
  /* Add DaisyUI window element
  <div class="mockup-window bg-base-300 rounded-b-none">
    <div class="flex justify-center px-4 py-16 bg-base-200">Hello!</div>
  </div>
  */
  console.log(data);
  document.getElementById("bar-card").replaceChildren(); // clear out bar-card

  var pickedBarCard = document.createElement("div");
  pickedBarCard.classList = "mockup-window bg-gray-300 rounded-b-none";
  var pickedBarCardContent = document.createElement("div");
  pickedBarCardContent.classList = "flex flex-col flex-start px-4 py-16 bg-gray-100";
  //pickedBarCardContent.innerHTML = '<p>' + data.result.editorial_summary.overview + '</p><br><p><a href="' + data.result.website + '">' + data.result.website + '"</a></p>';
  //console.log(data);

  var pname = "";
  var paddr = "";
  var pprice = "";
  var prating = "";
  var psummary = "";
  var pwebsite = "";
  var pbadges = '<div class="flex flex-row py-1">';
  var pbadgesdiv = '<div class="badge badge-neutral">';

  if ("name" in data.result) {
    pname = data.result.name;
  }
  if ("formatted_address" in data.result) {
    paddr = data.result.formatted_address;
  }
  if ("formatted_phone_number" in data.result) {
    paddr += " ☏ " + data.result.formatted_phone_number;
  }
  if ("price_level" in data.result) {
    for (var l = 0; l < Math.floor(parseInt(data.result.price_level)); l++) {
      pprice += "$";
    }
  }
  if ("rating" in data.result) {
    prating +=
      '<div class="flex flex-row"><p class="pr-1">rating: ' +
      data.result.rating +
      '<p><progress class="progress w-56" value="' +
      parseFloat(data.result.rating) * 10 +
      '" max="50"></progress></div>';
  }
  if ("editorial_summary" in data.result) {
    if ("overview" in data.result.editorial_summary) {
      psummary = data.result.editorial_summary.overview;
    }
  }
  if ("open_now" in data.result) {
    if (data.result.open_now) {
      pbadges += pbadgesdiv + "open now</div>";
    }
  }
  if ("delivery" in data.result) {
    if (data.result.delivery) {
      pbadges += pbadgesdiv + "delivery</div>";
    }
  }
  if ("dine_in" in data.result) {
    if (data.result.dine_in) {
      pbadges += pbadgesdiv + "dine in</div>";
    }
  }
  if ("reservable" in data.result) {
    if (data.result.reservable) {
      pbadges += pbadgesdiv + "reservable</div>";
    }
  }
  if ("serves_beer" in data.result) {
    if (data.result.serves_beer) {
      pbadges += pbadgesdiv + "beer</div>";
    }
  }
  if ("serves_wine" in data.result) {
    if (data.result.serves_beer) {
      pbadges += pbadgesdiv + "wine</div>";
    }
  }
  if ("takeout" in data.result) {
    if (data.result.takeout) {
      pbadges += pbadgesdiv + "takeout</div>";
    }
  }
  if ("wheelchair_accessible_entrance" in data.result) {
    if (data.result.wheelchair_accessible_entrance) {
      pbadges += pbadgesdiv + "wheelchair</div>";
    }
  }
  pbadges += "</div>";
  if ("website" in data.result) {
    pwebsite = '<p>Website: <a href="' + data.result.website + '">' + data.result.website + "</a></p>";
  }

  pickedBarCardContent.innerHTML =
    '<h1 class="text-2xl">' +
    pname +
    "</h1><p>" +
    paddr +
    "<br>" +
    pprice +
    "<br>" +
    prating +
    "<br>" +
    psummary +
    "</p>" +
    pbadges +
    "<br>" +
    pwebsite;

  pickedBarCard.appendChild(pickedBarCardContent);
  document.getElementById("bar-card").appendChild(pickedBarCard);

  // open drawer to display results
  opendrawer("searchresultdrawer");
}

// Get the place details from the Google Place API
var getGooglePlace = function (placeref) {
  // Google Place API documentation
  // https://developers.google.com/maps/documentation/places/web-service/place-id
  // Example: https://maps.googleapis.com/maps/api/place/details/json?place_id=ChIJ05IRjKHxEQ0RJLV_5NLdK2w&fields=place_id&key=YOUR_API_KEY
  var apiUrl =
    "https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/details/json?place_id=" +
    placeref +
    "&key=" +
    myapikeys.google;

  //console.log("will fetch details of venue", apiUrl);

  fetch(apiUrl, {
    method: "GET", // POST, PUT, DELETE, etc.
    headers: {
      Origin: "null", // cors-anywhere proxy needs this
      "Accept-Language": "en, *",
      Accept: "application/json",
    },
  })
    .then(function (response) {
      if (response.ok) {
        // console.log(response);
        response.json().then(function (data) {
          // console.log(data);
          displayGooglePlace(data);
        });
      } else {
        alert("Error: " + response.statusText);
      }
    })
    .catch(function (error) {
      alert("Unable to connect to Google");
    });
};

var getGoogleSearch = function (search) {
  // Google Places API documentation
  // https://developers.google.com/maps/documentation/places/web-service/search-nearby

  // Example google Place API call
  // Search Nearby  <=== This is probably what we should use, searches 20 items per page
  // curl -L -X GET 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=30.2849231%2C-97.7366316&radius=3000&type=bar&key=AIzaSyDAKGh9hM6lkhtz5MNmuUehgwnvtLVjYr8' -o test/yelp_api_test/googlenearbykeywordsearch2.json
  //
  // Place Photo API
  // curl -v -L -X GET 'https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=ATJ83zgjwIr7QgnwAzhRmWt9sS1vo3_T7vARZ0Q-rpyE0_C0cYXKp8TU26Kyox_uM1JZrjkPtoQUORW4cZrI9njShYAArFUVvWvIdITXAKVtJVVZ9naigktLd9L88nLDgSAA6kaZqzkgzDuKIn98zwCqaDE9KFXbxZUcDfEsNRVpRbRqTz4d&key=YOUR_API_KEY'

  var apiUrl =
    // "https://maps.googleapis.com/maps/api/place/nearbysearch/json?keyword=" +  // This gives a CORS error
    "https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/nearbysearch/json?keyword=" +
    search +
    "&location=" +
    barconfig.latitude +
    "%2C" +
    barconfig.longitude +
    "&radius=" +
    barconfig.radius +
    "&key=" +
    myapikeys.google;

  // console.log("will fetch ", apiUrl);
  // searchmap(search);  // use another google map API

  // Update our title to the search term
  document.getElementById("crawlertext").textContent = search;

  fetch(apiUrl, {
    method: "GET", // POST, PUT, DELETE, etc.
    headers: {
      Origin: "null", // cors-anywhere proxy needs this
      "Accept-Language": "en, *",
      Accept: "application/json",
    },
  })
    .then(function (response) {
      if (response.ok) {
        // console.log(response);
        response.json().then(function (data) {
          // console.log(data);
          displayGoogleBusinesses(data);
        });
      } else {
        alert("Error: " + response.statusText);
      }
    })
    .catch(function (error) {
      alert("Unable to connect to Google");
    });
};

// display the list of selected places
function displayselectedplaces() {
  var selectedplaces = document.getElementById("selectedplaces");
  selectedplaces.replaceChildren(); // clear the list
  console.log(selectedbarlist);
  for (var i = 0; i < selectedbarlist.length; i++) {
    var menuitem = document.createElement("li");
    menuitem.innerHTML = '<a data-placeid="' + selectedbarlist[i].place_id + '">' + selectedbarlist[i].name + "</a>";
    selectedplaces.appendChild(menuitem);
  }
}

// function to parse the data retrieved from the Google API
var displayGoogleBusinesses = function (data) {
  var wheeldata = []; // clear out wheel data
  // console.log("google places search results: ", data);
  barcardContainerEl.replaceChildren(); // clear out previous results

  if (data.results.length === 0) {
    barcardContainerEl.textContent = "No businesses found.";
    // Without a `return` statement, the rest of this function will continue to run and perhaps throw an error if `repos` is empty
    return;
  }

  var excludedcategories = ["point_of_interest", "establishment"]; // don't display these categories

  for (var i = 0; i < data.results.length; i++) {
    var barlist_item = data.results[i]; // populate data
    var businessname = data.results[i].name;
    var barimage = "";
    if (data.results[i].photos) {
      // Sometimes there is no photos
      barimage =
        "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=" +
        data.results[i].photos[0].photo_reference +
        "&key=" +
        myapikeys.google;
    } else {
      barimage = data.results[i].icon;
    }
    barlist_item.image = barimage;
    // console.log(businessname);
    let newbarcard = barcard.cloneNode(true);
    newbarcard.querySelector("div > figure > img").src = barimage;
    newbarcard.querySelector("div > div > h2").textContent = businessname;
    newbarcard.querySelector("input").setAttribute("id", data.results[i].place_id);
    newbarcard.querySelector("input").dataset.name = businessname;
    newbarcard.querySelector("input").dataset.lat = data.results[i].geometry.location.lat;
    newbarcard.querySelector("input").dataset.lng = data.results[i].geometry.location.lng;

    var categories = "";
    if (data.results[i].types.length > 0) {
      for (var j = 0; j < data.results[i].types.length; j++) {
        var categoryitem = data.results[i].types[j];
        if (!excludedcategories.includes(categoryitem)) {
          categories += '<div class="badge">' + data.results[i].types[j] + "</div>"; // ○ tailwind badge for categories
          // console.log(data.results[i].types[j]);
        } else {
          barlist_item.types.splice(barlist_item.types.indexOf(categoryitem), 1);
        }
      }
      newbarcard.querySelector("div > div > p").innerHTML = categories; // not using fontawesome: "<i class='fas fa-times status-icon icon-sunglasses'></i>"
    } else {
      newbarcard.querySelector("div > div > p").innerHTML = ""; // "<i class='fas fa-check-square status-icon icon-sunglasses'></i>";
    }

    // Add the new place into our place list (if it has no duplicate place_id)
    let foundplaceid = barlist.find(function (myobj) {
      return myobj.place_id === barlist_item.place_id;
    });
    if (!foundplaceid) {
      barlist.push(barlist_item);
      // Add a new marker on the map for searched items and store the marker in a object (hash array)
      markerlist[data.results[i].place_id] = newmarkMap(data.results[i].place_id);
    }

    if (i < Math.min(20, data.results.length)) {
      // put the first 10-20 search items in the wheel
      wheeldata[i] = {
        label: businessname.slice(0, 35), // Display first 39 characters for wheel
        value: i + 1,
        barCard: data.results[i].place_id,
      };
    }
    barcardContainerEl.appendChild(newbarcard);

    // Add event listener to select bars from the displayed cards
    document.getElementById(data.results[i].place_id).addEventListener("change", function (event) {
      // console.log(event.target.id, event.target.checked);
      // is this bar on the selected places list?
      let foundplaceid = selectedbarlist.findIndex(function (myobj) {
        return myobj.place_id === event.target.id;
      });
      // this card was just checked to selected
      if (event.target.checked) {
        // is this already in the selected places list?
        if (foundplaceid < 0) {
          // no, so let's add it and mark it on the map
          selectedbarlist.push({
            place_id: event.target.id,
            name: event.target.dataset.name,
            lat: event.target.dataset.lat,
            lng: event.target.dataset.lng,
          });
          markerlist[event.target.id].setIcon({ url: "./assets/images/blu-blank-32.png" });

          // refresh the selected places list
          displayselectedplaces();
        } else {
          // turn the marker back on
          markerlist[event.target.id].setIcon({ url: "./assets/images/blu-blank-32.png" });
        }
      } else {
        // user just unchecked this
        if (foundplaceid >= 0) {
          console.log(selectedbarlist[foundplaceid].name, selectedbarlist[foundplaceid].marker);
          markerlist[event.target.id].setIcon({ url: "./assets/images/mm_20_white.png" });
          selectedbarlist.splice(foundplaceid, 1);
        } else {
          console.log("unselect error: lost map marker to place_id ", event.target.id);
        }
      }
    });
  }
  document.getElementById("chart").replaceChildren();
  displayWheel(wheeldata);
};

// Google map Embed API - Reposition the map to locally configured latitude, longitude
/* function centermap() {
  // Documentation for Google Map Embed API:
  // https://developers.google.com/maps/documentation/embed/embedding-map
  var maplink =
    "https://www.google.com/maps/embed/v1/place?key=" +
    myapikeys.google +
    "&center=" +
    barconfig.latitude +
    "," +
    barconfig.longitude +
    "&zoom=12&q=" +
    barconfig.cityname;
  //console.log("Centering map to: ", maplink);
  document.getElementById("mainmap").setAttribute("src", maplink);
}
 */

// Google map Embed API: Display map with search pins
/* function searchmap(keywords) {
  // Documentation for Google Map Embed API:
  // https://developers.google.com/maps/documentation/embed/embedding-map
  var maplink =
    "https://www.google.com/maps/embed/v1/search?key=" +
    myapikeys.google +
    "&center=" +
    barconfig.latitude +
    "," +
    barconfig.longitude +
    "&zoom=12&q=" +
    keywords;
  //console.log("Centering map to: ", maplink);
  document.getElementById("mainmap").setAttribute("src", maplink);
}
 */

//Code for the wheel

/* Example data array for wheel:
var data = [
  { label: "Dell LAPTOP", value: 1, barCard: "Bar Info" }, // padding
  { label: "IMAC PRO", value: 2, barCard: "Bar nfo" }, //font-family
  { label: "SUZUKI", value: 3, barCard: "Bar Info" }, //color
  { label: "HONDA", value: 4, barCard: "Bar Info" }, //font-weight
  { label: "FERRARI", value: 5, barCard: "Bar Info" }, //font-size
  { label: "APARTMENT", value: 6, barCard: "Bar Info" }, //background-color
  { label: "IPAD PRO", value: 7, barCard: "Bar Info" }, //nesting
  { label: "LAND", value: 8, barCard: "Bar Info" }, //bottom
  { label: "MOTOROLLA", value: 9, barCard: "Bar Info" }, //sans-serif
  { label: "BMW", value: 10, barCard: "Bar Info" },
];
*/

function displayWheel(data) {
  var padding = { top: 20, right: 40, bottom: 0, left: 0 },
    w = 500 - padding.left - padding.right,
    h = 500 - padding.top - padding.bottom,
    r = Math.min(w, h) / 2,
    rotation = 0,
    oldrotation = 0,
    picked = 100000,
    oldpick = [],
    color = d3.scale.category20(); //category20c()
  //randomNumbers = getRandomNumbers()
  //http://osric.com/bingo-card-generator/?title=HTML+and+CSS+BINGO!&words=padding%2Cfont-family%2Ccolor%2Cfont-weight%2Cfont-size%2Cbackground-color%2Cnesting%2Cbottom%2Csans-serif%2Cperiod%2Cpound+sign%2C%EF%B9%A4body%EF%B9%A5%2C%EF%B9%A4ul%EF%B9%A5%2C%EF%B9%A4h1%EF%B9%A5%2Cmargin%2C%3C++%3E%2C{+}%2C%EF%B9%A4p%EF%B9%A5%2C%EF%B9%A4!DOCTYPE+html%EF%B9%A5%2C%EF%B9%A4head%EF%B9%A5%2Ccolon%2C%EF%B9%A4style%EF%B9%A5%2C.html%2CHTML%2CCSS%2CJavaScript%2Cborder&freespace=true&freespaceValue=Web+Design+Master&freespaceRandom=false&width=5&height=5&number=35#results
  function rotTween(to) {
    var i = d3.interpolate(oldrotation % 360, rotation);
    return function (t) {
      return "rotate(" + i(t) + ")";
    };
  }

  function getRandomNumbers() {
    var array = new Uint16Array(1000);
    var scale = d3.scale.linear().range([360, 1440]).domain([0, 100000]);
    if (window.hasOwnProperty("crypto") && typeof window.crypto.getRandomValues === "function") {
      window.crypto.getRandomValues(array);
      // console.log("works");
    } else {
      //no support for crypto, get crappy random numbers
      for (var i = 0; i < 1000; i++) {
        array[i] = Math.floor(Math.random() * 100000) + 1;
      }
    }
    return array;
  }

  var svg = d3
    .select("#chart")
    .append("svg")
    .data([data])
    .attr("width", w + padding.left + padding.right)
    .attr("height", h + padding.top + padding.bottom);
  var container = svg
    .append("g")
    .attr("class", "chartholder")
    .attr("transform", "translate(" + (w / 2 + padding.left) + "," + (h / 2 + padding.top) + ")");
  var vis = container.append("g");

  var pie = d3.layout
    .pie()
    .sort(null)
    .value(function (d) {
      return 1;
    });
  // declare an arc generator function
  var arc = d3.svg.arc().outerRadius(r);
  // select paths, use arc generator to draw
  var arcs = vis.selectAll("g.slice").data(pie).enter().append("g").attr("class", "slice");

  arcs
    .append("path")
    .attr("fill", function (d, i) {
      return color(i);
    })
    .attr("d", function (d) {
      return arc(d);
    });
  // add the text
  arcs
    .append("text")
    .attr("transform", function (d) {
      d.innerRadius = 0;
      d.outerRadius = r;
      d.angle = (d.startAngle + d.endAngle) / 2;
      return "rotate(" + ((d.angle * 180) / Math.PI - 90) + ")translate(" + (d.outerRadius - 10) + ")";
    })
    .attr("text-anchor", "end")
    .text(function (d, i) {
      return data[i].label;
    });
  container.on("click", spin);
  function spin(d) {
    container.on("click", null);
    //all slices have been seen, all done
    //console.log("OldPick: " + oldpick.length, "Data length: " + data.length);
    if (oldpick.length == data.length) {
      //console.log("done");
      container.on("click", null);
      return;
    }
    var ps = 360 / data.length,
      pieslice = Math.round(1440 / data.length),
      rng = Math.floor(Math.random() * 1440 + 360);

    rotation = Math.round(rng / ps) * ps;

    picked = Math.round(data.length - (rotation % 360) / ps);
    picked = picked >= data.length ? picked % data.length : picked;
    if (oldpick.indexOf(picked) !== -1) {
      d3.select(this).call(spin);
      return;
    } else {
      oldpick.push(picked);
    }
    rotation += 90 - Math.round(ps / 2);
    vis
      .transition()
      .duration(3000)
      .attrTween("transform", rotTween)
      .each("end", function () {
        //mark question as seen
        d3.select(".slice:nth-child(" + (picked + 1) + ") path").attr("fill", "#111");
        //populate question  comment it out
        d3.select("#bar-card h1").text(data[picked].name);
        oldrotation = rotation;

        // display the wheel pick
        getGooglePlace(data[picked].barCard);

        /* Get the result value from object "data" */
        //console.log(data[picked].value);

        /* Comment the below line for restrict spin to sngle time */
        container.on("click", spin);
      });
  }
  //make arrow
  svg
    .append("g")
    .attr("transform", "translate(" + (w + padding.left + padding.right) + "," + (h / 2 + padding.top) + ")")
    .append("path")
    .attr("d", "M-" + r * 0.15 + ",0L0," + r * 0.05 + "L0,-" + r * 0.05 + "Z")
    .style({ fill: "black" });
  //draw spin circle
  container.append("circle").attr("cx", 0).attr("cy", 0).attr("r", 60).style({ fill: "white", cursor: "pointer" });
  //spin text
  container
    .append("text")
    .attr("x", 0)
    .attr("y", 15)
    .attr("text-anchor", "middle")
    .text("SPIN")
    .style({ "font-weight": "bold", "font-size": "30px" });
}

// Drawer down event listeners
// Modified from https://www.w3schools.com/howto/howto_js_collapsible.asp
var drawers = document.getElementsByClassName("drawerdown");

function opendrawer(elementId) {
  var thisdrawer = document.getElementById(elementId);
  thisdrawer.classList.add("draweropen");
  var content = thisdrawer.previousElementSibling;
  content.style.maxHeight = content.scrollHeight + "px";
}

for (var i = 0; i < drawers.length; i++) {
  drawers[i].addEventListener("click", function (event) {
    event.preventDefault();
    event.target.classList.toggle("draweropen");
    var content = event.target.previousElementSibling;
    if (content.style.maxHeight) {
      content.style.maxHeight = null;
    } else {
      content.style.maxHeight = content.scrollHeight + "px";
    }
  });
}

// Create a new map marker from a place_id
// Google maps javascript documentation:
// https://www.w3schools.com/graphics/google_maps_intro.asp
// https://developers.google.com/maps/documentation/javascript/reference/marker
function newmarkMap(placeid) {
  var selectedbar = barlist.find(function (myobj) {
    return myobj.place_id === placeid;
  });

  //console.log(selectedbar);
  if (selectedbar) {
    var position = new google.maps.LatLng(selectedbar.geometry.location.lat, selectedbar.geometry.location.lng);
    // Add a marker, positioned at the specified location
    var marker = new google.maps.Marker({
      map: map,
      position: position,
      title: selectedbar.name,
      icon: {
        url: "./assets/images/mm_20_white.png",
      },
    });
    marker.setMap(map);
    return marker;
  }
}

// Build our Bar (or any other place type) Crawler Plan!
// This redirects to result.html which uses the travelling salesman solver to get the shortest distance route from
//    https://github.com/muyangye/Traveling_Salesman_Solver_Google_Maps
function createcrawl() {
  if (selectedbarlist.length < 2) {
    alert("Please enter at least 2 choices to create a crawl");
  } else {
    localStorage.setItem("waypoints", JSON.stringify(selectedbarlist));
    window.location.href = "result.html";
  }
}

// Initialize and add the map
// From Documentation:
// https://developers.google.com/maps/documentation/javascript/adding-a-google-map
var map;

// Use the old API
function initMap() {
  var lat = 0;
  var lng = 0;
  if (barconfig.latitude) {
    lat = barconfig.latitude;
    lng = barconfig.longitude;
  }
  var mapobj = {
    center: new google.maps.LatLng(lat, lng),
    zoom: 12,
  };
  map = new google.maps.Map(document.getElementById("map"), mapobj);
}

// initialize google geocoder api after window has loaded
var geocoder = new google.maps.Geocoder();

var autocomplete = null;

// initialize global variable autocomplete
function initializeautocomplete() {
  var input = document.getElementById('whattosearch');
  autocomplete = new google.maps.places.Autocomplete(input);

  google.maps.event.clearInstanceListeners(autocomplete);
  google.maps.event.addListener(autocomplete, 'place_changed', () => {
    var place = autocomplete.getPlace();
    // center main map
    map.setCenter(place.geometry.location);
    // console.log("autocomplete place: ",place);
  });
}

window.onload = (event) => {
  initMap();
  initializeautocomplete();
};
// google.maps.event.addDomListener(window, 'load', initializeautocomplete);

// main() start of javascript code after this is loaded
configload();

if (barconfig.latitude && barconfig.longitude) {
  // get weather on start screen
  getweather();
}


// if (barconfig.searchterm.length > 0) {
//  getGoogleSearch(barconfig.searchterm);
//}
