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

var bounds = new google.maps.LatLngBounds();

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
        start_marker = createMarker(new_start,"Start Point",'Start',"start_mark");
        move_marker = createMarker(new_start,"Moving",'Move',"middle_mark");
        end_marker = createMarker(new_end,"End Point",'End',"end_mark");
        map.fitBounds(bounds);

        startAnimation();
    }
}

function createMarker(latlng, label, html,name) {
// alert("createMarker("+latlng+","+label+","+html+","+color+")");
    var contentString = '<b>'+label+'</b><br>'+html;

    var marker = new google.maps.Marker({
        position: latlng,
        map: map,
        title: label,
        //icon: image
    });
    marker.myname = label;
    // gmarkers.push(marker);

    google.maps.event.addListener(marker, 'click', function() {
        infowindow.setContent(contentString);
        infowindow.open(map,marker);
    });
    return marker;
}

var tick = 100; // milliseconds
var eol;
var k=0;
var stepnum=0;
var speed = "";
var lastVertex = 1;
var step= 20000;

function updatePoly(d) {
    // Spawn a new polyline every 20 vertices, because updating a 100-vertex poly is too slow
    if (poly2.getPath().getLength() > 20) {
        poly2=new google.maps.Polyline([polyline.getPath().getAt(lastVertex-1)]);
        // map.addOverlay(poly2)
    }

    if (polyline.GetIndexAtDistance(d) < lastVertex+2) {
        if (poly2.getPath().getLength()>1) {
            poly2.getPath().removeAt(poly2.getPath().getLength()-1)
        }
        poly2.getPath().insertAt(poly2.getPath().getLength(),polyline.GetPointAtDistance(d));
    } else {
        poly2.getPath().insertAt(poly2.getPath().getLength(),endLocation.latlng);
    }
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
    google.maps.event.addListener(move_marker, "position_changed", function (event) {
        addLatLng(move_marker.getPosition());
    });
    eol=polyline.Distance();
    map.setCenter(polyline.getPath().getAt(0));
    // map.addOverlay(new google.maps.Marker(polyline.getAt(0),G_START_ICON));
    // map.addOverlay(new GMarker(polyline.getVertex(polyline.getVertexCount()-1),G_END_ICON));
    // marker = new google.maps.Marker({location:polyline.getPath().getAt(0)} /* ,{icon:car} */);
    // map.addOverlay(marker);
    poly2 = new google.maps.Polyline({path: [polyline.getPath().getAt(0)], strokeColor:"#0000FF", strokeWeight:10});
    // map.addOverlay(poly2);
    setTimeout("animate(50)",100);  // Allow time for the initial map display
}

google.maps.event.addDomListener(window, 'load', initialize);