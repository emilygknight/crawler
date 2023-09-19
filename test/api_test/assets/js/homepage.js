var userFormEl = document.querySelector("#user-form");
var languageButtonsEl = document.querySelector("#language-buttons");
var nameInputEl = document.querySelector("#username");
var repoContainerEl = document.querySelector("#repos-container");
var mySearchTerm = document.querySelector("#my-search-term");
var myFetchUrl = document.querySelector("#api-url");

var formSubmitHandler = function (event) {
  event.preventDefault();

  var searchterm = nameInputEl.value.trim();

  if (searchterm) {
    repoContainerEl.textContent = "";
    nameInputEl.value = "";
    if (document.getElementById("syelp").checked) {
      getYelpSearch(searchterm);
    } else {
      getGoogleSearch(searchterm);
    }
  } else {
    alert("Please enter a search term");
  }
};

var buttonClickHandler = function (event) {
  // `event.target` is a reference to the DOM element of what programming language button was clicked on the page
  var language = event.target.getAttribute("data-language");

  // If there is no language read from the button, don't attempt to fetch repos
  if (language) {
    getFeaturedRepos(language);

    repoContainerEl.textContent = "";
  }
};

var getYelpSearch = function (search) {
  // YELP API for events:
  //  curl -vvvk --request GET
  //      --url https://api.yelp.com/v3/events?categories=barcrawl
  //      --header 'Authorization: Bearer API_KEY'
  //      --header 'accept: application/json'

  // YELP API for businesses:
  /*
  curl -vvvk --request GET --header 'Origin: null' \
             --header 'Connection: close' \
             --header 'Accept: application/json' \
             --header 'Authorization: Bearer API_KEY' \
             'https://api.yelp.com/v3/businesses/search?term=bar&latitude=30.2849231&longitude=-97.7366316&radius=5000&limit=20'
  */

  // YELP API for businesses example via CORS proxy:
  /*
  curl -vvvk --request GET --header 'Origin: null' \
             --header 'Connection: close' \
             --header 'Accept: application/json' \
             --header 'Authorization: Bearer API_KEY' \
             'https://cors-anywhere.herokuapp.com/https://api.yelp.com/v3/businesses/search?term=bar&latitude=30.2849231&longitude=-97.7366316&radius=5000&limit=20'
  */

  var latitude = 30.2849231;
  var longitude = -97.7366316;
  var radius = 5000; //5km
  //var apiUrl = "https://api.yelp.com/v3/businesses/search?term" + search;
  var apiUrl =
    "https://cors-anywhere.herokuapp.com/https://api.yelp.com/v3/businesses/search?term=" +
    search +
    "&latitude=" +
    latitude +
    "&longitude=" +
    longitude +
    "&radius=" +
    radius +
    "&limit=20";

  console.log("will fetch ", apiUrl);
  myFetchUrl.textContent = apiUrl;

  fetch(apiUrl, {
    method: "GET", // POST, PUT, DELETE, etc.
    //mode: 'cors',
    headers: {
      Authorization: "Bearer " + myapikeys.yelp, // API key is in headers for Yelp API
      Accept: "application/json",
      Origin: "null",
    },
  })
    .then(function (response) {
      if (response.ok) {
        console.log(response);
        response.json().then(function (data) {
          console.log(data);
          displayYelpBusinesses(data, "user");
        });
      } else {
        alert("Error: " + response.statusText);
      }
    })
    .catch(function (error) {
      alert("Unable to connect to Yelp");
    });
};

var getGoogleSearch = function (search) {
  var latitude = 30.2849231;
  var longitude = -97.7366316;
  var radius = 5000; //5km

  // Google Places API documentation
  // https://developers.google.com/maps/documentation/places/web-service/search-find-place#maps_http_places_findplacefromtext_mca-txt
  // https://developers.google.com/maps/documentation/places/web-service/search-nearby

  // Example google Place API call
  // Text search
  // curl -L -X GET 'https://maps.googleapis.com/maps/api/place/textsearch/json?query=bars%20in%20Austin&key=YOUR_API_KEY'
  //
  // Find Place request for "bars", using the locationbias parameter to prefer results within 2000 meters of the specified coordinates
  // curl -L -X GET 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=mongolian&inputtype=textquery&locationbias=circle%3A2000%4047.6918452%2C-122.2226413&fields=formatted_address%2Cname%2Crating%2Copening_hours%2Cgeometry&key=YOUR_API_KEY'
  //
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
    latitude +
    "%2C" +
    longitude +
    "&radius=" +
    radius +
    "&key=" +
    myapikeys.google;

  console.log("will fetch ", apiUrl);
  myFetchUrl.textContent = apiUrl;

  fetch(apiUrl, {
    method: "GET", // POST, PUT, DELETE, etc.
    //mode: 'cors',
    headers: {
      Origin: "null",
      "Accept-Language": "en, *",
      Accept: "application/json",
    },
  })
    .then(function (response) {
      if (response.ok) {
        console.log(response);
        response.json().then(function (data) {
          console.log(data);
          displayGoogleBusinesses(data, "user");
        });
      } else {
        alert("Error: " + response.statusText);
      }
    })
    .catch(function (error) {
      alert("Unable to connect to Yelp");
    });
};

var getUserRepos = function (user) {
  var apiUrl = "https://api.github.com/users/" + user + "/repos";

  fetch(apiUrl)
    .then(function (response) {
      if (response.ok) {
        console.log(response);
        response.json().then(function (data) {
          console.log(data);
          displayRepos(data, user);
        });
      } else {
        alert("Error: " + response.statusText);
      }
    })
    .catch(function (error) {
      alert("Unable to connect to GitHub");
    });
};

var getFeaturedRepos = function (language) {
  // The `q` parameter is what language we want to query, the `+is:featured` flag adds a filter to return only featured repositories
  // The `sort` parameter will instruct GitHub to respond with all of the repositories in order by the number of issues needing help
  var apiUrl = "https://api.github.com/search/repositories?q=" + language + "+is:featured&sort=help-wanted-issues";

  fetch(apiUrl).then(function (response) {
    if (response.ok) {
      response.json().then(function (data) {
        displayRepos(data.items, language);
      });
    } else {
      alert("Error: " + response.statusText);
    }
  });
};

var displayYelpBusinesses = function (data, searchTerm) {
  if (data.businesses.length === 0) {
    repoContainerEl.textContent = "No businesses found.";
    // Without a `return` statement, the rest of this function will continue to run and perhaps throw an error if `repos` is empty
    return;
  }

  mySearchTerm.textContent = searchTerm;

  for (var i = 0; i < data.businesses.length; i++) {
    // The result will be `<github-username>/<github-repository-name>`
    var businessName = data.businesses[i].name + "/" + data.businesses[i].alias;

    console.log(businessName);
    var repoEl = document.createElement("div");
    repoEl.classList = "list-item flex-row justify-space-between align-center";

    var titleEl = document.createElement("span");
    titleEl.textContent = businessName;

    repoEl.appendChild(titleEl);

    var statusEl = document.createElement("span");
    statusEl.classList = "flex-row align-center";

    if (data.businesses[i].categories.length > 0) {
      let categories = "";
      for (var j = 0; j < data.businesses[i].categories.length; j++) {
        categories += data.businesses[i].categories[j].alias + " ";
        console.log(data.businesses[i].categories[j].alias);
      }
      statusEl.innerHTML = "<i class='fas fa-times status-icon icon-sunglasses'></i>" + categories;
    } else {
      statusEl.innerHTML = "<i class='fas fa-check-square status-icon icon-sunglasses'></i>";
    }

    repoEl.appendChild(statusEl);

    repoContainerEl.appendChild(repoEl);
  }
};

// render Google results
var displayGoogleBusinesses = function (data, searchTerm) {
  if (data.results.length === 0) {
    repoContainerEl.textContent = "No businesses found.";
    // Without a `return` statement, the rest of this function will continue to run and perhaps throw an error if `repos` is empty
    return;
  }

  mySearchTerm.textContent = searchTerm;

  for (var i = 0; i < data.results.length; i++) {
    // The result will be `<github-username>/<github-repository-name>`
    var businessName = data.results[i].name;

    console.log(businessName);
    var repoEl = document.createElement("div");
    repoEl.classList = "list-item flex-row justify-space-between align-center";

    var titleEl = document.createElement("span");
    titleEl.textContent = businessName;

    repoEl.appendChild(titleEl);

    var statusEl = document.createElement("span");
    statusEl.classList = "flex-row align-center";

    if (data.results[i].types.length > 0) {
      let categories = "";
      for (var j = 0; j < data.results[i].types.length; j++) {
        categories += data.results[i].types[j] + " ";
        console.log(data.results[i].types[j]);
      }
      statusEl.innerHTML = "<i class='fas fa-times status-icon icon-sunglasses'></i>" + categories;
    } else {
      statusEl.innerHTML = "<i class='fas fa-check-square status-icon icon-sunglasses'></i>";
    }

    repoEl.appendChild(statusEl);

    repoContainerEl.appendChild(repoEl);
  }
};

var displayRepos = function (repos, searchTerm) {
  if (repos.length === 0) {
    repoContainerEl.textContent = "No repositories found.";
    // Without a `return` statement, the rest of this function will continue to run and perhaps throw an error if `repos` is empty
    return;
  }

  mySearchTerm.textContent = searchTerm;

  for (var i = 0; i < repos.length; i++) {
    // The result will be `<github-username>/<github-repository-name>`
    var repoName = repos[i].owner.login + "/" + repos[i].name;

    var repoEl = document.createElement("div");
    repoEl.classList = "list-item flex-row justify-space-between align-center";

    var titleEl = document.createElement("span");
    titleEl.textContent = repoName;

    repoEl.appendChild(titleEl);

    var statusEl = document.createElement("span");
    statusEl.classList = "flex-row align-center";

    if (repos[i].open_issues_count > 0) {
      statusEl.innerHTML =
        "<i class='fas fa-times status-icon icon-danger'></i>" + repos[i].open_issues_count + " issue(s)";
    } else {
      statusEl.innerHTML = "<i class='fas fa-check-square status-icon icon-success'></i>";
    }

    repoEl.appendChild(statusEl);

    repoContainerEl.appendChild(repoEl);
  }
};

userFormEl.addEventListener("submit", formSubmitHandler);
languageButtonsEl.addEventListener("click", buttonClickHandler);
