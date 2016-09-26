var start_marker = null;
var end_marker = null;
var move_marker = null;
var polyline = null;
var poly2 = null;
var speed = 0.000005, wait = 1;
var new_poly = new google.maps.Polyline({
    strokeColor: 'blue',
    strokeWeight: 3,
    geodesic:false
});

var timerHandle = null;
var steps_counter =0;
var step = 100;

var markers = [];
var map;
var mapOptions = {
    zoom: 10,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    center: new google.maps.LatLng(-31.9505, 115.8605)
};

var mark_counter = 0;

var infowindow = new google.maps.InfoWindow();

function initialize() {
    map = new google.maps.Map(document.getElementById("map_canvas"),
        mapOptions);
    getGeoJSON();
}

function getGeoJSON() {
    polyline = new google.maps.Polyline({
        path: [],
        strokeColor: '#FF0000',
        strokeWeight: 3
    });
    relations = relations[0];
    for(var i in relations['first_degree']) {
        var new_start = new google.maps.LatLng(relations['user'].lat, relations['user'].lon);
        var new_end = new google.maps.LatLng(relations['first_degree'][i].lat, relations['first_degree'][i].lon);

        polyline.getPath().push(new_start);
        bounds.extend(new_start);
        polyline.getPath().push(new_end);
        bounds.extend(new_end);
        start_marker = createMarker(new_start,"Start Point",start_adr,"start_mark");
        move_marker = createMarker(new_start,"Moving",start_adr,"middle_mark");
        end_marker = createMarker(new_end,"End Point",end_adr,"end_mark");
        map.fitBounds(bounds);

        startAnimation();
    }
}

function createMarker(latlng, label, html,name) {
// alert("createMarker("+latlng+","+label+","+html+","+color+")");
    var contentString = '<b>'+label+'</b><br>'+html;
    var image = new google.maps.MarkerImage(
        scriptFolder+"images/"+name+".png",
        null, /* size is determined at runtime */
        null, /* origin is 0,0 */
        null, /* anchor is bottom center of the scaled image */
        new google.maps.Size(32,32)
    );
    var marker = new google.maps.Marker({
        position: latlng,
        map: map,
        title: label,
        icon: image
    });
    marker.myname = label;
    // gmarkers.push(marker);

    google.maps.event.addListener(marker, 'click', function() {
        infowindow.setContent(contentString);
        infowindow.open(map,marker);
    });
    return marker;
}

function animate(d) {
// alert("animate("+d+")");
    if (d>eol) {
        map.panTo(endLocation.latlng);
        move_marker.setPosition(endLocation.latlng);
        move_marker.setMap(null);
        return;
    }
    var p = polyline.GetPointAtDistance(d);
    map.panTo(p);
    move_marker.setPosition(p);
    updatePoly(d);
    timerHandle = setTimeout("animate("+(d+step)+")", tick);
    steps_counter++;
}

function addLatLng(event) {
    if(steps_counter > 0) {
        if(steps_counter == 1) new_poly.setMap(map);
        var path = new_poly.getPath();
        // Because path is an MVCArray, we can simply append a new coordinate
        // and it will automatically appear.
        path.push(event);
    }
    else new_poly.setPath([]);
}

function startAnimation() {
    google.maps.event.addListener(marker, "position_changed", function (event) {
        addLatLng(marker.getPosition());
    });
    eol=polyline.Distance();
    map.setCenter(polyline.getPath().getAt(0));
    // map.addOverlay(new google.maps.Marker(polyline.getAt(0),G_START_ICON));
    // map.addOverlay(new GMarker(polyline.getVertex(polyline.getVertexCount()-1),G_END_ICON));
    // marker = new google.maps.Marker({location:polyline.getPath().getAt(0)} /* ,{icon:car} */);
    // map.addOverlay(marker);
    poly2 = new google.maps.Polyline({path: [polyline.getPath().getAt(0)], strokeColor:"#0000FF", strokeWeight:10});
    // map.addOverlay(poly2);
    setTimeout("animate(50)",2000);  // Allow time for the initial map display
}

google.maps.event.addDomListener(window, 'load', initialize);