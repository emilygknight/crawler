var barconfig = {
  latitude: 30.266666,
  longitude: -97.73333,
  radius: 5000,
  defaultsearchterm: "bar",
};

var barcardContainerEl = document.querySelector("#barcardcontainer");

var barcard = createElementFromHTML(
  `
      <div class="card w-1/5 bg-base-100 shadow-xl">
        <figure><img src="./assets/images/wil-stewart-UErWoQEoMrc-unsplash.jpg" alt="Drinks" /></figure>
        <div class="card-body">
          <h2 class="card-title">Drinks!</h2>
          <p>Find your drink!</p>
        </div>
      </div>
    `
);

// Create cards from html
function createElementFromHTML(htmlString) {
  var div = document.createElement("div");
  div.innerHTML = htmlString.trim();
  // Change this to div.childNodes to support multiple top-level nodes.
  return div.firstChild;
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

    barconfig.latitude = latitude;
    barconfig.longitude = longitude;

    // Search from the default search term
    var searchterm = document.getElementById("whattosearch").value.trim();
    if (searchterm.length === 0) {
      searchterm = barconfig.defaultsearchterm;
    }
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

var getGoogleSearch = function (search) {
  // Google Places API documentation
  // https://developers.google.com/maps/documentation/places/web-service/search-nearby

  // Example google Place API call
  // Search Nearby  <=== This is probably what we should use, searches 20 items per page
  // curl -L -X GET 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=30.2849231%2C-97.7366316&radius=3000&keyword=bar&key=YOUR_API_KEY' -o test/yelp_api_test/googlenearbykeywordsearch2.json
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

  console.log("will fetch ", apiUrl);

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
        console.log(response);
        response.json().then(function (data) {
          console.log(data);
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

var displayGoogleBusinesses = function (data) {
  if (data.results.length === 0) {
    barcardContainerEl.textContent = "No businesses found.";
    // Without a `return` statement, the rest of this function will continue to run and perhaps throw an error if `repos` is empty
    return;
  }

  for (var i = 0; i < data.results.length; i++) {
    // The result will be `<github-username>/<github-repository-name>`
    var businessName = data.results[i].name;

    console.log(businessName);

    let newbarcard = barcard.cloneNode(true);
    newbarcard.querySelector("div > figure > img").src = "./assets/images/wil-stewart-UErWoQEoMrc-unsplash.jpg";
    newbarcard.querySelector("div > div > h2").textContent = businessName;

    if (data.results[i].types.length > 0) {
      let categories = "";
      for (var j = 0; j < data.results[i].types.length; j++) {
        categories += data.results[i].types[j] + " ";
        console.log(data.results[i].types[j]);
      }
      newbarcard.querySelector("div > div > p").innerHTML =
        "<i class='fas fa-times status-icon icon-sunglasses'></i>" + categories;
    } else {
      newbarcard.querySelector("div > div > p").innerHTML =
        "<i class='fas fa-check-square status-icon icon-sunglasses'></i>";
    }

    barcardContainerEl.appendChild(newbarcard);
  }
};

//Code for the wheel

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
  console.log("OldPick: " + oldpick.length, "Data length: " + data.length);
  if (oldpick.length == data.length) {
    console.log("done");
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
      //populate question
      d3.select("#bar-card h1").text(data[picked].barCard);
      oldrotation = rotation;

      /* Get the result value from object "data" */
      console.log(data[picked].value);

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
    console.log("works");
  } else {
    //no support for crypto, get crappy random numbers
    for (var i = 0; i < 1000; i++) {
      array[i] = Math.floor(Math.random() * 100000) + 1;
    }
  }
  return array;
}
