let q;
let limit = 10;
let apiKey = "nn4fnsxxZWkye8zyKGu3HPe2SLOy09VV";
let topicTitle;
let header = $("#header");
let sticky = header.offsetTop;
let colorSwitch = false;
let topics = [
    "The Office",
    "New Girl",
    "It's Always Sunny in Philadelphia",
    "Modern Family",
    "Parks and Recreation",
    "Arrested Development"
];
let favorites = [];
let firstAdd = false;
let showFavs = false;

$(document).ready(function () {
    // checks local storage for our topics array
    if (localStorage["storedTopics"]) {
        // if it's there, retrieve it
        let localData = localStorage.getItem("storedTopics");
        topics = JSON.parse(localData);
    } else {
        // if it's not there, send the topics array to localstorage
        updateLocalStorage("storedTopics", topics);
    }

    if (localStorage["storedFavorites"]) {
        let localData = localStorage.getItem("storedFavorites");
        favorites = JSON.parse(localData);
    } else {
        updateLocalStorage("storedFavorites", favorites);
    }
    if (favorites.length > 0) {
        showFavs = true;
        firstAdd = true;
    }

    toggleFavPanel();

    // loads topic buttons
    loadTopics();

    // Click Events:

    // topic button click event
    $("body").on("click", ".btnTopic", function () {
        // store the topic button that was clicked and send it to it's function
        let thisBtn = $(this);
        btnTopicClick(thisBtn);
    });

    // gif click event for stop/start animation
    $("body").on("click", ".gif", function () {
        // get the state of the gif, change url accordingly
        let state = $(this).attr("dataState");
        if (state === "still") {
            $(this).attr("src", $(this).attr("animate-url"));
            $(this).attr("dataState", "animate");
        } else {
            $(this).attr("src", $(this).attr("still-url"));
            $(this).attr("dataState", "still");
        }
    });

    // add topic button click event
    $("#add-topic").on("click", function () {
        addTopic();
    });

    // add topic on enter
    $("#topic-input").keypress(function (e) {
        let key = e.which;
        if (key === 13) {
            addTopic();
        }
    });

    // favorite button click event
    $("body").on("click", ".btnFavorite", function () {
        let thisBtn = $(this);
        addToFav(thisBtn);
    });

    // show/hide favorites panel
    $("body").on("click", ".toggle-favs", function () {
        if ($(this).attr("id") === "show-favs") {
            showFavs = true;
        } else {
            showFavs = false;
        }
        toggleFavPanel();
    });

    // 'X' button that removes favorites from favorites panel
    $("body").on("click", ".btnRemove", function () {
        let Id = $(this).attr("id");
        Id = Id.substr(3);
        let btn = $("#" + Id);
        console.log(btn.length);
        if (btn.length > 0) {
            addToFav(btn);
        } else {
            let idx = favorites.indexOf(Id);
            favorites.splice(idx, 1);
            updateLocalStorage("storedFavorites", favorites);
            processFavorites();
            if (favorites.length === 0) {
                showFavs = false;
                toggleFavPanel();
            }
        }
    });
});

// creates a button for each item in the topics array
function loadTopics() {
    for (i = 0; i < topics.length; i++) {
        $("<button>")
            .attr({
                class: "btn btn-primary btnTopic",
                dataTopic: topics[i],
                btnState: "inactive"
            })
            .text(topics[i])
            .appendTo("#categories");
    }
}

// updates the local storage with the topics array
function updateLocalStorage(key, value) {
    if (localStorage[key]) {
        localStorage.removeItem(key);
    }
    localStorage.setItem(key, JSON.stringify(value));
}

// adds a topic button and saves it to the topics array
function addTopic() {
    // get the textbox value
    let topicToAdd = $("#topic-input")
        .val()
        .trim();

    // if the textbox isn't empty, add a new btnTopic button
    if (topicToAdd.length > 0) {
        $("<button>")
            .attr({
                class: "btn btn-primary btnTopic",
                dataTopic: topicToAdd,
                btnState: "inactive"
            })
            .text(topicToAdd)
            .appendTo("#categories");

        //update topics array
        topics.push(topicToAdd);

        //update local storage with the topics array
        updateLocalStorage("storedTopics", topics);

        // clean up
        $("#topic-input").val("");
    }
}

// handles the click event for a topic button
function btnTopicClick(thisBtn) {
    // store topic for panel titles
    topicTitle = $(thisBtn).attr("dataTopic");

    // store a formatted topicTitle for the query and panel ID
    q = topicTitle.replace(/\s/g, "-");
    q = q.replace(/'/g, "");

    // get the button state
    let state = $(thisBtn).attr("btnState");

    // if the button state is inactive, make it active and run the api query
    if (state === "inactive") {
        $(thisBtn)
            .addClass("clicked")
            .attr({ btnState: "active" })
            .prepend("&#10003; ");

        queryAPI();

        // if the button state is active, remove the panel with the matching id, inactivate button
    } else {
        // get the panel id
        let topicID = "#" + q;

        // remove the panel with the matching id
        $(".topicPanel").remove(topicID);

        // update the button to its original state
        $(thisBtn)
            .removeClass("clicked")
            .blur()
            .attr("btnState", "inactive")
            .text(topicTitle);
    }
}

// queries the API
function queryAPI() {
    // build the url for the api call
    let queryURL =
        "https://api.giphy.com/v1/gifs/search?api_key=" +
        apiKey +
        "&limit=" +
        limit;
    queryURL += "&q=" + q;

    // api call
    $.ajax({
        url: queryURL,
        method: "GET"
    }).done(function (response) {
        // store the results
        let results = response.data;
        console.log(results);

        // create the panel that will hold the resulting gifs
        let topicPanel = $("<div>").attr({
            class: "panel panel-default topicPanel",
            id: q
        });

        // create panel header, append it to the panel
        let panelHeading = $('<div class="panel-heading">')
            .attr({
                "data-toggle": "collapse",
                href: "#collapse-" + q
            })
            .text(topicTitle)
            .appendTo(topicPanel);

        // alternates the color of the panel headers
        if (colorSwitch) {
            panelHeading.css({
                background: "#a63a50",
                "border-color": "#a63a50"
            });
            colorSwitch = false;
        } else {
            colorSwitch = true;
        }

        // glyph to show collapsed/not collapsed
        let glyphSpan = $("<span>")
            .html("<p>")
            .appendTo(panelHeading);

        let glyph = $('<i class="glyphicon glyphicon-chevron-up">').appendTo(
            glyphSpan
        );

        // create a div to wrap the panel body to make it collapsible, append it to the panel
        let collapseDiv = $('<div class="panel-collapse collapse in">')
            .attr("id", "collapse-" + q)
            .appendTo(topicPanel)
            // change glyph based on whether or not the panel is collapsed
            .on("shown.bs.collapse", function () {
                glyph
                    .addClass("glyphicon-chevron-up")
                    .removeClass("glyphicon-chevron-down");
            })
            .on("hidden.bs.collapse", function () {
                glyph
                    .addClass("glyphicon-chevron-down")
                    .removeClass("glyphicon-chevron-up");
            });

        // create panel body, append it to the collapse div
        let panelBody = $('<div class="panel-body">').appendTo(collapseDiv);

        // loop through the results and get what we need
        for (var i = 0; i < results.length; i++) {
            let gifID = results[i].id;
            // label for the gif (Rating for now, may add title later)
            let labelDiv = $("<div>");
            let label = "<b> Rating: " + results[i].rating.toUpperCase() + "</b>";
            // create favorite button
            let btnFavorite = $('<button class="btn btn-default btnFavorite">').attr(
                "id",
                gifID
            );

            // add the label to the label div
            labelDiv.html(label);
            // see if the button is in favorites already, and add the appropriate star
            updateFavBtn(btnFavorite);
            // add the button to the labeldiv
            labelDiv.prepend(btnFavorite);

            // create the img element for the gif
            var resultImage = $("<img>");

            // assign attributes to the img from the results
            resultImage.attr({
                src: results[i].images.fixed_height_still.url,
                dataState: "still",
                "animate-url": results[i].images.fixed_height.url,
                "still-url": results[i].images.fixed_height_still.url,
                class: "gif",
                alt: results[i].title,
                id: "#gif-" + gifID
            });

            // create the div to hold each result
            let resultDiv = $('<div class="resultDiv">').append(
                labelDiv,
                resultImage
            );

            // add the result div to the panel body
            panelBody.prepend(resultDiv);
        }

        // prepend the panel to #results
        $("#results").prepend(topicPanel);
    });
}

// queries the api for gifs with the matching ids in favorites[]
function processFavorites() {
    // clear the gifs in the panel (prevents duplicates)
    $("#favBody").empty();

    /* if showFavs is true and the favorites array isn't empty, run the query
       Note: This check is necessary because running the query when the favorites aren't displayed is pointless
           and running the query with no ids returns an error */
    if (showFavs && favorites.length > 0) {
        var queryURL =
            "https://api.giphy.com/v1/gifs?api_key=" + apiKey + "&ids=" + favorites;
        $.ajax({
            url: queryURL,
            method: "GET"
        }).done(function (response) {
            var results = response.data;

            // loop through the results
            for (i = 0; i < results.length; i++) {
                // create the img element for the gif
                let resultImage = $("<img>");

                // assign attributes to the img from the results
                resultImage.attr({
                    src: results[i].images.fixed_height_still.url,
                    dataState: "still",
                    "animate-url": results[i].images.fixed_height.url,
                    "still-url": results[i].images.fixed_height_still.url,
                    class: "gif",
                    alt: results[i].title,
                    id: "#fav-" + results[i].id
                });
                // id for the remove button
                let Id = "rmv" + results[i].id;
                // create the div for each result
                let resultDiv = $('<div class="resultDiv">');
                // glyph for the remove button
                let favRemove = $('<span class="glyphicon glyphicon-remove">');
                // create the remove button, give it's id and cool glyph
                let btnRemove = $('<button class="btn btn-default btnRemove">')
                    .attr("id", Id)
                    .append(favRemove);
                // add button and gif to resultdiv
                resultDiv.append(btnRemove, resultImage);
                // add resultdiv to favorite section
                $("#favBody").prepend(resultDiv);
            }
        });
    }
}

// formats the "add to favorite" button
function updateFavBtn(thisBtn) {
    thisBtn.empty();
    let Id = $(thisBtn).attr("id");
    let btnState = $(thisBtn).attr("btnState");
    let favStar = $('<span class="glyphicon">');
    // if it's not in favorites[], empty star otherwise filled star
    if (favorites.indexOf(Id) < 0) {
        $(thisBtn).attr("btnState", "inactive");
        favStar.removeClass("glyphicon-star").addClass("glyphicon-star-empty");
    } else {
        $(thisBtn).attr("btnState", "active");
        favStar.removeClass("glyphicon-star-empty").addClass("glyphicon-star");
    }
    $(thisBtn).append(favStar);
}

// adds/removes favorites
function addToFav(thisBtn) {
    let btnID = $(thisBtn).attr("id");
    let favStar = $('<span class="glyphicon glyphicon-star">');
    // if the button id doesn't exist in favorites, add it. otherwise remove it
    if (favorites.indexOf(btnID) < 0) {
        $(thisBtn).attr("btnState", "active");
        favorites.push(btnID);
    } else {
        $(thisBtn).attr("btnState", "inactive");
        let idx = favorites.indexOf(btnID);
        favorites.splice(idx, 1);
    }
    let favCount = favorites.length;
    $("#show-favs")
        .html(" (" + favCount + ")")
        .prepend(favStar);
    // update the star
    updateFavBtn(thisBtn);
    // update the localstorage
    updateLocalStorage("storedFavorites", favorites);
    // fill out favorites panel
    processFavorites();
    if (favCount === 0) {
        showFavs = false;
        toggleFavPanel();
    }
    // if it's the first favorite added, show the favorites panel
    if (!firstAdd) {
        firstAdd = true;
        showFavs = true;
        toggleFavPanel();
    }
}

// displays or removes the favorites panel
function toggleFavPanel() {
    let favCount = favorites.length;
    let favStar = $('<span class="glyphicon glyphicon-star">');
    if (showFavs && favCount > 0) {
        $("#show-favs").hide();
        $("#results").addClass("col-md-8");
        $("#favorites")
            .removeClass("col-xs-0")
            .addClass("col-xs-12 col-md-4");

        let favPanel = $("<div>").attr({
            class: "panel panel-default",
            id: "favPanel"
        });

        let favHeading = $('<div class="panel-heading">').appendTo(favPanel);
        let favTitle = $('<h3 class="panel-title">')
            .html("Favorites<br>")
            .appendTo(favHeading);
        let hideFavs = $('<button class="btn btn-default toggle-favs">')
            .text(" Hide")
            .attr("id", "hide-favs")
            .appendTo(favTitle);

        hideFavs.prepend(favStar);
        let favBody = $('<div class="panel-body" id="favBody">').appendTo(favPanel);
        favPanel.appendTo("#favorites");
        firstAdd = true;
        processFavorites();
    } else {
        $("#show-favs")
            .html(" (" + favCount + ")")
            .prepend(favStar)
            .show();
        $("#favorites").empty();
        $("#results").removeClass("col-md-8");
        $("#favorites")
            .removeClass("col-xs-12 col-md-4")
            .addClass("col-xs-0");
    }
}
