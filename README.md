# Places - openrouteservice

Routing provider for [Places](https://community.obsidian.md/plugins/places) using [openrouteservice](https://openrouteservice.org/), with directions, isochrones, POI search, elevation replacement, and track snapping.

This is not a stand-alone plugin, to use, install along side [Places](https://community.obsidian.md/plugins/places). Refer to the [sandbox](https://sandbox.obsidian.stanton.dev/places/) for examples.

## Network requests

| Area           | Request                                                     |
| -------------- | ----------------------------------------------------------- |
| Directions     | Builds a route between the waypoints in a block             |
| Isochrones     | Builds reachability polygons around a center point          |
| POI search     | Resolves a search term to place suggestions and coordinates |
| Elevation      | Reads elevation for the points of a track                   |
| Track snapping | Aligns a recorded track to the road or path network         |

Requests go to `https://api.openrouteservice.org`.

## Background tasks

None.

## Dependencies

| Library                                                      | Purpose                                        |
| ------------------------------------------------------------ | ---------------------------------------------- |
| [places-shared](https://github.com/bobstanton/places-shared) | Shared map, overlay, routing, and utility code |
