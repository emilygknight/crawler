var userFormEl = document.querySelector("#user-form");
var languageButtonsEl = document.querySelector("#language-buttons");
var nameInputEl = document.querySelector("#username");
var repoContainerEl = document.querySelector("#repos-container");
var repoSearchTerm = document.querySelector("#repo-search-term");

var formSubmitHandler = function (event) {
  event.preventDefault();

  var username = nameInputEl.value.trim();

  if (username) {
    repoContainerEl.textContent = "";
    nameInputEl.value = "";
    getYelpSearch(username);
  } else {
    alert("Please enter a Yelp search term");
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
  // curl -vvvk --request GET
  //      --url "https://api.yelp.com/v3/businesses/search?term=bar&latitude=30.2849231&longitude=-97.7366316&radius=5000&limit=20"
  //      --header 'Authorization: Bearer API_KEY'
  //      --header 'accept: application/json' | json_pp > yelpbusinesssearch.json

  var latitude = 30.2849231;
  var longitude = -97.7366316;
  var radius = 5000; //5km
  //var apiUrl = "https://api.yelp.com/v3/businesses/search?term" + search;
  var apiUrl =
    "https://api.yelp.com/v3/events?limit=20&categories=" +
    search +
    "&latitude=" +
    latitude +
    "&longitude=" +
    longitude +
    "&radius=" +
    radius;

  console.log("will fetch ", apiUrl);
//  var data = JSON.parse(yelp_b_searchexample);
//  console.log(data);
//  displayYelpBusinesses(data, search);

  /* Current fetch has problems due to CORS */

  var myHeaders = new Headers();
  myHeaders.append("Authorization", "Bearer E_PPY2I4Kj_RTIlu5iBCzVSdbNhgM8698ypfBPe7-KM3JkJfHtxBjWd5x6KOuvG_2OORfPPl-wb5vpDrVgbttjhU2F7aC2OJATUzhX6CDa0_i5KL2zneMFcyuLUIZXYx");
  myHeaders.append("Cookie", "__cfduid=db290300ecfe95ec1fe3bc92c388c3c991586618117");
  myHeaders.append("Access-Control-Allow-Origin", "*");
  
  var proxyUrl = 'https://cors-anywhere.herokuapp.com/'
  // var targetUrl = 'https://api.yelp.com/v3/businesses/search?location=Houston'
  var targetUrl = 'https://api.yelp.com/v3/businesses/search?term=bar&latitude=30.2849231&longitude=-97.7366316&radius=5000&limit=20';
  
  var requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
  };
  
  fetch(proxyUrl + targetUrl, requestOptions)
/*
  fetch(apiUrl, {
    method: "GET", // POST, PUT, DELETE, etc.
    //mode: 'cors',
    headers: {
      "x-requested-with": "xmlhttprequest",
      "Access-Control-Allow-Origin": "*",
      // "Content-Type": "text/plain;charset=UTF-8"
      "Authorization": "Bearer " + myapikeys.yelp, // API key is in headers for Yelp API
      "Accept": "application/json",
      "redirect": 'follow'
    },
  }) */
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
    /**/
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

  repoSearchTerm.textContent = searchTerm;

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
      statusEl.innerHTML =
        "<i class='fas fa-times status-icon icon-sunglasses'></i>" + categories;
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

  repoSearchTerm.textContent = searchTerm;

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
