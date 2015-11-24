$(document).ready(function(){

    // deviceready event
    document.addEventListener("deviceready", onDeviceReady, false);



});


// deviceready 
function onDeviceReady(){

    // delete
    console.log("Hallo Master!");  

    // run default AJAx behaviour
    defaultAjaxLoader(); 

    // fire from memory
    var bus  = window.localStorage.getItem("bus-number");
    var stop = window.localStorage.getItem("select-bus-stop");

    // if previous search exists
    if (bus || stop) {
      predict(bus, stop); 
    }

    // close bottom on neewselect link
    document.getElementById("newselect").addEventListener("click", function(){
       $("#part2").hide();
       $("#part3").hide();
    });
}



// select (part 2)
function selectBusRoute(busstop) {

 $.get( 'http://raitis.co.uk:9000/getStops', { 'nr': $("#bus-number" ).val() }, function(data) {

                     var options = $("#select-bus-stop");

                     // make sure "select-bus-stop" tag is empty
                     options.empty();

                     $.each(data, function() {
                        // each option has id, lat, lang values
                        options.append(new Option( this.name, [this.id, this.lat, this.lon ] ));
                     });

                     // show part 2
                     $( "#part2" ).show();

                     // if loaded from memory set select to bus saved busstop
                     if (busstop) {
                        $("#select-bus-stop").val(busstop);
                     }

                     // refresh select box
                     $("#select-bus-stop").selectmenu('refresh');

                 });

  // for new search hide previous results
  $("#part3").hide();
}




// predict arrival (part 3)
function predict(bus, stop) {
 
 // read inputs, if there is not arguments
 if (bus == null || stop == null) {
   var st = $("#select-bus-stop").val();
   var nr = $("#bus-number").val(); }
 else {
   var st = stop;
   var nr = bus;
   // set saved bus in the input
   $("#bus-number").val(nr);
   selectBusRoute(stop);
 }

 // set in local storage
 window.localStorage.setItem("select-bus-stop", st);
 window.localStorage.setItem("bus-number", nr);

 var station = st.split(',');

 // execute maps only once
 time = "";
 run = true;

 // initial run
 updateArrivals();

 // set interval (20s)
 var tid = setInterval(function() { updateArrivals(true); }, 20000);

 // to be called when you want to stop the timer
 function abortTimer() { 
   clearInterval(tid);
 }

 // abort updates if select new route
 document.getElementById("select-bus-stop").addEventListener("click", function(){
   abortTimer(); 
 });

 document.getElementById("newselect").addEventListener("click", function(){
   $("#bus-number").val('');
   window.localStorage.removeItem("select-bus-stop");
   window.localStorage.removeItem("bus-number");
   abortTimer(); 
 });

 document.getElementById("button-bus-number").addEventListener("click", function(){
   abortTimer(); 
 });

 // repeating update function
 function updateArrivals(repeater) {
     
     // disable AJAX setup if repeating for update
     if (repeater) {
        $.ajaxSetup({ beforeSend: function() {}, complete: function() {}, global:false });
     }

     $.get('http://raitis.co.uk:9000/predict', { 'nr': nr, 'st': station[0]}, function(data) {

                  // sorting json
                  data = data.sort(sortByProperty('timeToStation'));

                  // clear previous results
                  $("#result ul").empty();

                  // loop each result
                  $.each(data, function() {

                    // change time to "Approaching"
                    if (this.timeToStation < 120)
                       time = "Approaching";
                    else
                       time = secToMin(this.timeToStation);

                    $("#result ul").append('<li>' + time + '</li>');

                    // map update executed only once
                    if (run) {
                       loadMap(parseFloat(station[1]), parseFloat(station[2]));
                        run = false;
                    }

                  });

                  // update time
                  $("#datetime").html("Last updated: " + moment().format('h:mm:ss a'));

                  // if no data
                  if ($.isEmptyObject(data)) {
                    $("#result ul").append('<li>No Data</li>');
                    $("#map").hide();
                  }      

        }); // end ajax call

       // enable AJAX setup if repeating for update
       if (repeater) {
          defaultAjaxLoader(); 
       }

  
  // end updateArrivals
  }

  // display results
  $("#part3").show();

}



// sort Json object
var sortByProperty = function (property) {
    return function (x, y) {
        return ((x[property] === y[property]) ? 0 : ((x[property] > y[property]) ? 1 : -1));
    };
};


// convert seconds to minutes
function secToMin(sec) {
 var hr = Math.floor(sec / 3600);
 var min = Math.floor((sec - (hr * 3600))/60);
 sec -= ((hr * 3600) + (min * 60));
 sec += ''; min += '';
 while (min.length < 2) {min = '0' + min;}
 while (sec.length < 2) {sec = '0' + sec;}
 hr = (hr)?':'+hr:'';
 return hr + min + ' min';
}



// load map
function loadMap(lat, lng) {
 if (lat && lng) {
  var myLatLng = {lat: lat, lng: lng};

  var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 15,
    center: myLatLng
  });

  var marker = new google.maps.Marker({
    position: myLatLng,
    map: map,
  });
 }
}


function defaultAjaxLoader() {
   // default AJAX loader
    $.ajaxSetup({
      beforeSend: function() {
       $("#home").animate({'opacity':0.3});
       $("#ajax-loader").show();
      },
      complete: function(){
       $("#home").animate({'opacity':1});  
       $("#ajax-loader").hide();
      },  
      success: function() {}
    }); // end AJAX
}

