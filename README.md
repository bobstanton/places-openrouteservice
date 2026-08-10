# Places - openrouteservice

Routing provider for [Places](https://community.obsidian.md/plugins/places) using [openrouteservice](https://openrouteservice.org/), with directions, isochrones, POI search, elevation replacement, and track snapping.

## Network requests

| Area           | Request                                             |
| -------------- | --------------------------------------------------- |
| Directions     | Builds a route between the waypoints in a block     |
| Isochrones     | Builds reachability polygons around a center point  |
| POI search     | Resolves a search term to place suggestions         |
| Elevation      | Reads elevation for the points of a track           |
| Track snapping | Aligns a recorded track to the road or path network |

Requests go to `https://api.openrouteservice.org`.

## Background tasks

None.

## Dependencies

| Library                                                      | Purpose                                        |
| ------------------------------------------------------------ | ---------------------------------------------- |
| [places-shared](https://github.com/bobstanton/places-shared) | Shared map, overlay, routing, and utility code |
