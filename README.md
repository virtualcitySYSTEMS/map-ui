# VC Map

VC Map is an Open-Source JavaScript framework and API for building dynamic and interactive maps on the web. It can display
2D data, oblique imagery and massive 3D data including terrain data, vector data, mesh models, and point clouds making it
easy for users to explore and interact with the data in an integrated and high-performance map application. VC Map apps can
be rendered in all modern web browsers and on both desktop and mobile devices, bringing the map to where the user is.
VC Map is built upon open, proven, and reliable GIS and web technologies such as [OpenLayers](https://github.com/openlayers/openlayers)
and [Cesium](https://github.com/cesiumGS/cesium/) for the visualization of 2D and 3D geo-data. It can load and display data
from various sources and in different formats including open OGC standards and interfaces. Users can easily switch between
the 2D, oblique and 3D views and dynamically add map layers to the scene that are accessible in all views. The VC Map
framework offers ready-to-use map tools and widgets that can be flexibly combined in a VC Map app to meet the needs and demands of end-users and the target audience. Examples are navigation controls, map layers and legends, drawing and editing tools, split screens, camera flights, and GIS tools such as measurements, height profiles, view shed analysis, or real-time shadows.
VC Map provides a strong programming API for developers that makes it easy to build customized VC Map applications,
to integrate VC Maps into any web page and to extend its functionalities with own plugins. The VC Map framework and API
is structured into the following four main architectural layers:

#### [VC Map Core](https://github.com/virtualcitySYSTEMS/map-core)

The VC Map Core is a thin abstraction layer and wrapper around OpenLayers and Cesium. It provides a common data and feature
management API and automatically synchronizes data and user actions between the 2D, oblique and 3D views. Map functions and
tools can be developed against this Core API to make them available in 2D, 3D and the oblique view rather than having to
develop them redundantly and based on different technologies.

#### Configuration Management

The VC Map framework offers a flexible and fully customizable map configuration management. All contents of a VC Map application
such as available layers, views, tools, and plugins are managed in a JSON-based configuration file that is loaded when starting
the application. Every VC Map application can thus be easily configured according to the end-user needs. Map configurations can
be dynamically changed, extended, and serialized at runtime through a corresponding API.

#### Modern User Interface

VC Map comes with a modern UI interface for VC Map applications that provides UI components for all map tools and widgets
implemented based on Vue.js and HTML5. In addition, the VC Map framework provides pre-built, low-level UI elements that can
be used by developers to easily build more complex user dialogs from and include them in a map application.

#### [Plugin API](https://github.com/virtualcitySYSTEMS/map-plugin-cli)

VC Map is easy to customize and extend through a well-defined Plugin API. Plugins allow for adding new functionalities,
tools, and user dialogs to a VC Map application. Plugins can be added to a VC Map through the configuration file or loaded
dynamically to an existing map application using the Plugin API. Plugin developers can use the entire VC Map stack
(VC Map Core, configuration management, UI components) for building their own extensions.

# Components

### [@vcmap/core](https://github.com/virtualcitySYSTEMS/map-core)

Provides an abstraction layer around 2D, 3D and oblique Maps. Provides the following components:

- map abstraction for Cesium, Openlayers and Oblique Images
- layers
- interactions
- styles
- application and module/config handling

### [@vcmap/ui](https://github.com/virtualcitySYSTEMS/map-ui)

This Project, provides

- a configurable and extendable ui
- extends the @vcmap/core application handling with a plugin Concept, see [@vcmap/plugin-cli](https://github.com/virtualcitySYSTEMS/map-plugin-cli)
- extends the @vcmap/core application with a windowManager

### [@vcmap/plugin-cli](https://github.com/virtualcitySYSTEMS/map-plugin-cli)

Provides a tool to create, develop and build Plugins for the @vcmap/ui.
Plugin Concept documentation can also be found there.

### [@vcmap/ui webpack5 integration template](https://github.com/virtualcitySYSTEMS/map-ui-webpack5-example)

Example Template to show how to integrate the @vcmap/ui in a webpack5 project.

### [@vcmap/core demo](https://github.com/virtualcitySYSTEMS/map-core-demo)

Example demo Application based on the @vcmap/core, shows how to implement a different UI on top of the @vcmap/core

## Component Diagram

![A schema on component interactions](./documentation/VC_Map_Diagram.png)

# Project and Components

- contentTree API [CONTENT_TREE](documentation/CONTENT_TREE.md)
- windowManager API [WINDOWS](documentation/WINDOWS.md)
- Navbar/ButtonManager/ToolboxManager [BUTTONS](documentation/BUTTONS.md)/[TOOLBOX](documentation/TOOLBOX.md)
- OrientationTools
- ActionConcept [ACTIONS](documentation/ACTIONS.md)
- PluginConcept [Plugin API](https://github.com/virtualcitySYSTEMS/map-plugin-cli)
- SEARCH API [SEARCH](documentation/SEARCH.md)
- I18n API [INTERNATIONALIZATION](documentation/INTERNATIONALIZATION.md).
- CATEGORIES API [CATEGORIES](documentation/CATEGORIES.md).
- Context Menu API [CONTEXT_MENU](documentation/CONTEXT_MENU.md)
- FeatureInfo [FEATURE_INFO](documentation/FEATURE_INFO.md)
- [State & Application Link](documentation/STATE.md)
- [Help Concept](documentation/HELP.md)
- Copyright [ATTRIBUTIONS](documentation/ATTRIBUTIONS.md)

# Project Release Cycle and Version Management

### Major Version Releases:

We plan to release new major versions on an annual basis, and these releases may include breaking changes.
Additionally, each major release will incorporate the latest versions of Cesium and Openlayers.

### Patches and Minor Releases:

Patches and minor releases will be issued approximately every two months. This may involve releasing minor versions of
OpenLayers and introducing new Cesium versions, provided there are no breaking changes in the Cesium version.
Plugins designed for a major version should seamlessly function with any new minor or patch version of VC Map.

### Bugfix Support:

We will offer bugfix support for the current major version and the one preceding it.

# Roadmap / Future Development

### Core

- Clustering Prio 4
- Style Refactoring Prio 4

### Ui

- Overlay API Support

# Plugins

[Drawing](https://github.com/virtualcitySYSTEMS/map-draw)
[Print](https://github.com/virtualcitySYSTEMS/map-print)
[Export](https://github.com/virtualcitySYSTEMS/map-export)
[Swipe Tool](https://github.com/virtualcitySYSTEMS/map-swipe-tool)
[Shadow](https://github.com/virtualcitySYSTEMS/map-shadow)
[Create Link](https://github.com/virtualcitySYSTEMS/map-createLink)
[Search Nominatim](https://github.com/virtualcitySYSTEMS/map-search-nominatim)

### Plugins in Development

|       Plugin       | Dev Prio | Proj Prio |
| :----------------: | :------: | :-------: |
|    Measurement     |    1     |     1     |
|      Planning      |    1     |     1     |
|     MultiView      |    4     |     1     |
|   HeightProfile    |    4     |     2     |
|       Flight       |    4     |     2     |
|      ViewShed      |    4     |     2     |
| TransparentTerrain |    4     |     3     |
|      Walkmode      |    4     |     3     |
|    ClippingTool    |    4     |     3     |
|  AttributeEditor   |    4     |     3     |
|       Query        |    4     |     3     |
|      Locator       |    4     |     4     |
|   DisplayQuality   |    4     |     4     |
|    Search esri     |    4     |     4     |
|     Search WFS     |    4     |     4     |

# Getting started

For a first start, clone the repo and call `npm i` `npm run start` This will start a development server. The
app can be opened with http://localhost:8080.

Further Information see [GET_STARTED](documentation/GET_STARTED.md) and [Plugin-cli](https://github.com/virtualcitySYSTEMS/map-plugin-cli).

## Included Dataset

The included datasets for Berlin and Osnabrück in the app configurations in the project can only be used for Development.
For further usage of the datasets please contact [Virtual City Systems](https://vc.systems).
