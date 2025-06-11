# virtualcityMAP URL Parameters Explained

In a virtualcityMAP, you can create a link using the "_Generate Link (Share Current View of the Map)_" function that allows the map to return to the exact view you had when the link was created. This means that the map's current view, active layers (things you can see on the map), and information for certain plugins will be restored when the link is used to open a new map.
The link can also be manually modified or created to open a map. Specifically, the Viewpoint can include an EPSG Code that references the default coordinate system of the map. If no EPSG Code is included, it assumes the coordinates are in WGS84.
Additionally, a simple Extent with an EPSG Code of the default coordinate system can be used to open the map at a specific location.

The URL generated for this purpose includes several parameters in a json format, which are explained below.

The URL looks like this example:
https://www.virtualcitymap.de/?state=%5B%5B%5B13.38353617980784%2C52.48478489765%2C4485.669126988868%5D%2C%5B13.374295459096624%2C52.501788790079296%2C34.67348112592285%5D%2C4877.323844315262%2C341.6527146904639%2C-65.87455219323445%2C0.00019392617134003342%5D%2C%22cesium%22%2C%5B%22VC+Map+Demo%22%5D%2C%5B%5D%2C%5B%5B%22%40vcmap%2Fmulti-view%22%2C%7B%22active%22%3Afalse%7D%5D%2C%5B%22%40vcmap%2Fviewshed%22%2C%7B%22mode%22%3Anull%7D%5D%2C%5B%22%40vcmap%2Fcesium-filters%22%2C%7B%22lig%22%3A%7B%7D%7D%5D%5D%2C0%2C%5B%5D%5D

It uses regular URL encoding to describe the state of the Map. Here is the example in a decoded format:

https://dev.virtualcitymap.de/?state=[[[13.374111020006039,52.5126411114975,1039.4376606886788],[13.371271496304264,52.52529109057904,31.074206921777545],1742.3485377927661,352.2041224093141,-35.3681884544751,359.9689882100514],"cesium",["VC+Map+Demo"],[],[["@vcmap/multi-view",{"active":false}],["@vcmap/viewshed",{"mode":null}],["@vcmap/cesium-filters",{"lig":{}}]],0,[]]

Alternatively, a second example with a EPSG Code in the URL:

https://dev.virtualcitymap.de/?state=[[[13.374111020006039,52.5126411114975,1039.4376606886788],[13.371271496304264,52.52529109057904,31.074206921777545],1742.3485377927661,352.2041224093141,-35.3681884544751,359.9689882100514,4326],"cesium",["VC+Map+Demo"],[],[["@vcmap/multi-view",{"active":false}],["@vcmap/viewshed",{"mode":null}],["@vcmap/cesium-filters",{"lig":{}}]],0,[]]

This is how the URL looks schematically:

https://dev.virtualcitymap.de/?state=[[[longitude,latitude,altitude],[longitude,latitude,altitude],distance,heading,pitch,roll],"map_type",[modules],[layers],[plugins],obliqueMap,[clippingPolygons]]

If one of the names contains empty spaces they are connected via `+`.

## Viewpoint Parameters

These parameters describe the viewpoint of the map, how far the camera is, and how the camera is positioned:

Parameters marked with \* can optionally be used in the URL by the user to open a map at a specific location.

### Camera Position and Ground Position

The first two sets of coordinates describe the start and end points for the camera's focus. The map centers around these points, with the camera being placed at the position of the first point, the Camera Position, and focusing on the position of the second point, the Ground Position.
These Coordinates are partially optional, only one has to be given. The Coordinates are given in x,y,z format and are seperated by comma and given in the WGS84 coordinate system.

- Example:  
  `[[13.374111020006039,52.5126411114975,1039.4376606886788],[13.371271496304264,52.52529109057904,31.074206921777545]]`
  - Start: Longitude `13.3741`, Latitude `52.5126`, Altitude `1039.44`
  - End: Longitude `13.3713`, Latitude `52.5253`, Altitude `31.07`

---

### Distance

The camera's distance from the ground point to the camera position in meters indicates the zoom level or how far away the camera is positioned.

- Example:  
  `1742.35`  
  (The camera is 1,742.35 meters away from the ground point.)

---

### Heading

The heading defines the direction in which the camera (azimuth) is facing, in degrees, relative to north (0 or 360 degrees).

- Example:  
  `O` (The camera is facing north.)

  `90` (The camera is facing east.)

  `180` (The camera is facing south.)

  `270` (The camera is facing west.)

---

### Pitch

Specifies the tilt angle of the camera. With a value of 0, the camera points towards the horizon. With a value of -90, the camera points directly to the ground. The values must be in the range between 0 and -90.

- Example:  
  `-90` (The camera is pointing to the ground.)

  `0` (The camera is pointing to the horizon.)

---

### Roll

A subtle adjustment to the camera's roll refers to how level the camera is. It's typically close to 0 or 360 degrees, as the roll cannot be manually controlled and usually remains level.

- Example:  
  `359.97`  
  (A very slight adjustment roll of the camera.)

---

### \*EPSG Code

An optional parameter that specifies the EPSG code of the coordinate system used in the Map as default. If no EPSG code is given, the coordinates are assumed to be in WGS84.

- Example:  
  `25832`

---

## \*Extent Parameters

An optional way of providing a location to the map is by using an Extent. It needs two coordinates that describe the lower left and upper right corner of the extent. The coordinates are given in x,y format and are seperated by comma.
Here is a partial Example of a URL with an Extent:

http://dev.virtualcitymap.de/?state=[[[690340.49,5322140.33,692561.84,5334842.39],25832],0,["VC+Map+Demo"]]

## Starting Map Name

You can provide the starting map name in the URL. This is the _name_ of the map
that is loaded when the URL is used to open the application. The name is given as a string.

- Example: `"my_map_name"`

## Module Parameter

The next Element in the Link contains one or multiple IDs that reference the Modules that are currently loaded in the Map. The Module IDs are listed in an array and separated by a comma.
Their states are cached, but they are not automatically added to the map if they are in the URL, only when they are manually added (via API or activated by a user) back to the map again they retain their settings.

- Example: `["VC+Map+Demo"]`

## Layer Activation and Deactivation

These parameters control which map layers are visible when the scene is loaded. Can be used to deactivate layers that are active when the application is started as well as activate layers that are usually inactive when the scene is loaded. (The names of the layers can be found out using the "Generate Link" function. The names are different for each virtualcityMAP).

To describe this an array is used. The first places describes the name of the layer, the second is either `0` (for inactive) or `1` (for active) and the third place describes the name of the active Style (if there is no style it is `0`).

- Example:
  `["osmBuildingFootprints",1, 0 ]`

## Plugin Parameters

The following section of the URL specifies settings for certain Plugins. These Parameters are plugin-specific. First the plugin name is specified and then an object defines the information for the plugin.

- Example: `json ["@vcmap/cesium-filters",
{
"baw":{
"enabled":true
},
"lig":{
"lightIntensity":3
}
}
]` (In this case the Cesium filters Plugin, has the baw (black and white) filter enabled and the light intensity is set to 3)

## Oblique Collection

The following parameter in the URL describes the currently active Oblique Collection. If the Oblique Map is not selected the standard value is `0` otherwise it is a string of the name of the oblique collection.

- Example: `"obliques"`

## Clipping Polygons

The last parameter in the URL describes the currently active Clipping Polygons. If no clipping polygon is active the value defaults to an empty array `[]` otherwise it is an array of string of the names of the clipping polygons.

- Example: `["clippingPolygon"]`
