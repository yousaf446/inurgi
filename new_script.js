var map;
var polyline = [];
var poly2 = [];
var start_marker = [];
var end_marker = [];
var move_marker = [];
var timerHandle = [];
var bounds = new google.maps.LatLngBounds();
var steps_counter = [];
var infowindow = null;
var new_poly = [];

var mark_counter = 0;
var relations;
function initialize() {

    infowindow = new google.maps.InfoWindow(
        {
            size: new google.maps.Size(150,50)
        });

    var myOptions = {
        zoom: 10,
        mapTypeId: google.maps.MapTypeId.HYBRID
    }
    map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);

    setRoutes();
}


function createMarker(latlng, label, html, visible, id, symbol) {
// alert("createMarker("+latlng+","+label+","+html+","+color+")");

    var icon = getSymbol(symbol);
    var contentString = '<b>'+label+'</b><br>'+html;
    var marker = new google.maps.Marker({
        position: latlng,
        map: map,
        title: label,
        id: id,
        visible: visible,
        zIndex: Math.round(latlng.lat()*-100000)<<5
    });

    if(symbol != "") marker.setIcon(icon);
    marker.myname = label;


    /*google.maps.event.addListener(marker, 'click', function() {
        infowindow.setContent(contentString);
        infowindow.open(map,marker);
    });*/
    return marker;
}

function setRoutes() {
    $.ajax({
        url: 'http://inurgi.com/get_relations/50',
        dataType: "json",
        success: function(data){
            relations = JSON.parse(data);
            for (var i in relations[0]['first_degree']) {
                makeRouteCallback(mark_counter);
                mark_counter++;
            }
        },
        error: function(data){
        }
    });
}

function callBackFunction(data) {
    console.log(data);
}


    function makeRouteCallback(routeNum){
        steps_counter[routeNum] = 0;
        var new_start = new google.maps.LatLng(relations[0]['user'].lat, relations[0]['user'].lon);
        var new_end = new google.maps.LatLng(relations[0]['first_degree'][routeNum].lat, relations[0]['first_degree'][routeNum].lon);
        start_marker[routeNum] = createMarker(new_start,"Start Point",'Start', true , routeNum, "star");
        move_marker[routeNum] = createMarker(new_start,"Moving",'Move', false, routeNum, "");
        end_marker[routeNum] = createMarker(new_end,"End Point",'End', false, routeNum, "green");
        polyline[routeNum] = new google.maps.Polyline({
            path: [],
            strokeColor: '#44D768',
            strokeWeight: 3
        });

        new_poly[routeNum] = new google.maps.Polyline({
            strokeColor: '#44D768',
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

function makeRouteCallbackSecond(primaryRoute, secondRoute, routeNum){
    steps_counter[routeNum] = 0;
    var new_start = new google.maps.LatLng(relations[0]['first_degree'][primaryRoute].lat, relations[0]['first_degree'][primaryRoute].lon);
    var new_end = new google.maps.LatLng(relations[0]['first_degree'][primaryRoute]['second_degree'][secondRoute].lat, relations[0]['first_degree'][primaryRoute]['second_degree'][secondRoute].lon);
    start_marker[routeNum] = createMarker(new_start,"Start Point",'Start', false , routeNum, "");
    move_marker[routeNum] = createMarker(new_start,"Moving",'Move', false, routeNum, "");
    end_marker[routeNum] = createMarker(new_end,"End Point",'End', false, routeNum, "blue");
    polyline[routeNum] = new google.maps.Polyline({
        path: [],
        strokeColor: '#449DD7',
        strokeWeight: 3
    });

    new_poly[routeNum] = new google.maps.Polyline({
        strokeColor: '#449DD7',
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

    var tick = 50; // milliseconds
    var eol;
    var k=0;
    var stepnum=0;
    var speed = "";
    var lastVertex = 1;
    var step= 20000;

    function updatePoly(d, index) {
        if (poly2[index].getPath().getLength() > 20) {
            poly2[index]=new google.maps.Polyline([polyline[index].getPath().getAt(lastVertex-1)]);
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
        if (d>eol) {
            move_marker[index].setPosition(end_marker[index].getPosition());
            end_marker[index].setVisible(true);
            for(var i in relations[0]['first_degree'][index]['second_degree']) {
                makeRouteCallbackSecond(index, i, mark_counter);
                mark_counter++;
            }
            return;
        }
        var p = polyline[index].GetPointAtDistance(d);
        if(p != null) move_marker[index].setPosition(p);
        updatePoly(d, index);
        timerHandle = setTimeout("animate("+(d+step)+", "+index+")", tick);
        steps_counter[index]++;
    }

    function addLatLng(event, index) {
        if(event.lat() != null) new_poly[index].getPath().push(event);
    }

    function startAnimation(index) {
        google.maps.event.addListener(move_marker[index], "position_changed", function (event) {
            addLatLng(this.getPosition(), this.id);
        });
        eol=polyline[index].Distance();
        poly2[index] = new google.maps.Polyline({path: [polyline[index].getPath().getAt(0)], strokeColor:"#0000FF", strokeWeight:10});
        setTimeout("animate(0, "+index+")",50);  // Allow time for the initial map display
    }

function getSymbol(symbol) {
    var icon = "";
    if(symbol == "green") {
        icon = {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 5,
            strokeColor: '#44D768',
            fillColor: '#44D768'
        };
    } else if(symbol == "blue") {
        icon = {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 5,
            strokeColor: '#449DD7',
            fillColor: '#449DD7'
        }
    } else if(symbol == "star") {
        icon = new google.maps.MarkerImage(
            "user.png",
            null, /* size is determined at runtime */
            null, /* origin is 0,0 */
            new google.maps.Point(16, 16), /* anchor is bottom center of the scaled image */
            new google.maps.Size(32, 32)
        );
    }
    return icon;
}

//----------------------------------------------------------------------------
google.maps.event.addDomListener(window,'load',initialize);