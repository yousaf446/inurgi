var map;
var marker = [];
var polyline = [];
var poly2 = [];
var start_marker = [];
var end_marker = [];
var move_marker = [];
var timerHandle = [];
var bounds = new google.maps.LatLngBounds();
var steps_counter = [];
var speed = 0.000005, wait = 1;
var infowindow = null;
var new_poly = [];
var Colors = ["#FF0000", "#00FF00", "#0000FF"];


function initialize() {

    infowindow = new google.maps.InfoWindow(
        {
            size: new google.maps.Size(150,50)
        });

    var myOptions = {
        zoom: 10,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    }
    map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);

    setRoutes();
}


function createMarker(latlng, label, html, visible, id) {
// alert("createMarker("+latlng+","+label+","+html+","+color+")");
    var contentString = '<b>'+label+'</b><br>'+html;
    var marker = new google.maps.Marker({
        position: latlng,
        map: map,
        title: label,
        id: id,
        visible: visible,
        zIndex: Math.round(latlng.lat()*-100000)<<5
    });
    marker.myname = label;


    google.maps.event.addListener(marker, 'click', function() {
        infowindow.setContent(contentString);
        infowindow.open(map,marker);
    });
    return marker;
}

function setRoutes() {

    for (var i in relations[0]['first_degree']) {
        makeRouteCallback(i);
    }
}


    function makeRouteCallback(routeNum){
        steps_counter[routeNum] = 0;
        var new_start = new google.maps.LatLng(relations[0]['user'].lat, relations[0]['user'].lon);
        var new_end = new google.maps.LatLng(relations[0]['first_degree'][routeNum].lat, relations[0]['first_degree'][routeNum].lon);
        start_marker[routeNum] = createMarker(new_start,"Start Point",'Start', true , routeNum);
        move_marker[routeNum] = createMarker(new_start,"Moving",'Move', true, routeNum);
        end_marker[routeNum] = createMarker(new_end,"End Point",'End', false, routeNum);
        polyline[routeNum] = new google.maps.Polyline({
            path: [],
            strokeColor: '#FFFF00',
            strokeWeight: 3
        });

        new_poly[routeNum] = new google.maps.Polyline({
            strokeColor: 'blue',
            strokeWeight: 3,
            geodesic:false,
            map: map
        });
        polyline[routeNum].getPath().push(new_start);
        bounds.extend(new_start);
        polyline[routeNum].getPath().push(new_end);
        bounds.extend(new_end);
        map.fitBounds(bounds);

        startAnimation(routeNum);

}

    var tick = 100; // milliseconds
    var eol;
    var k=0;
    var stepnum=0;
    var speed = "";
    var lastVertex = 1;
    var step= 20000;

    function updatePoly(d, index) {
        // Spawn a new polyline every 20 vertices, because updating a 100-vertex poly is too slow
        if (poly2[index].getPath().getLength() > 20) {
            poly2[index]=new google.maps.Polyline([polyline[index].getPath().getAt(lastVertex-1)]);
            // map.addOverlay(poly2)
        }

        if (polyline[index].GetIndexAtDistance(d) < lastVertex+2) {
            if (poly2[index].getPath().getLength()>1) {
                poly2[index].getPath().removeAt(poly2[index].getPath().getLength()-1)
            }
            poly2[index].getPath().insertAt(poly2[index].getPath().getLength(),polyline[index].GetPointAtDistance(d));
        } else {
            poly2[index].getPath().insertAt(poly2[index].getPath().getLength(),end_marker[index].getPosition());
        }
    }

    function animate(d, index) {
// alert("animate("+d+")");
        if (d>eol) {
            //map.panTo(end_marker[index].getPosition());
            move_marker[index].setPosition(end_marker[index].getPosition());
            move_marker[index].setVisible(false);
            end_marker[index].setVisible(true);
            return;
        }
        var p = polyline[index].GetPointAtDistance(d);
        //map.panTo(p);
        if(p != null) move_marker[index].setPosition(p);
        updatePoly(d, index);
        timerHandle = setTimeout("animate("+(d+step)+", "+index+")", tick);
        steps_counter[index]++;
    }

    function addLatLng(event, index) {
        //if(steps_counter[index] > 0) {
            if(event.lat() != null) new_poly[index].getPath().push(event);
            // Because path is an MVCArray, we can simply append a new coordinate
            // and it will automatically appear.
            //path.push(event);
            //bounds.extend(event);
            //map.fitBounds(bounds);
        //}
        //else new_poly[index].setPath([]);
    }

    function startAnimation(index) {
        google.maps.event.addListener(move_marker[index], "position_changed", function (event) {
            addLatLng(this.getPosition(), this.id);
        });
        eol=polyline[index].Distance();
        //map.setCenter(polyline[index].getPath().getAt(0));
        // map.addOverlay(new google.maps.Marker(polyline.getAt(0),G_START_ICON));
        // map.addOverlay(new GMarker(polyline.getVertex(polyline.getVertexCount()-1),G_END_ICON));
        // marker = new google.maps.Marker({location:polyline.getPath().getAt(0)} /* ,{icon:car} */);
        // map.addOverlay(marker);
        poly2[index] = new google.maps.Polyline({path: [polyline[index].getPath().getAt(0)], strokeColor:"#0000FF", strokeWeight:10});
        // map.addOverlay(poly2);
        setTimeout("animate(50, "+index+")",2000);  // Allow time for the initial map display
    }

//----------------------------------------------------------------------------
google.maps.event.addDomListener(window,'load',initialize);