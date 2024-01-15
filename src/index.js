// Import a module
import _ from 'lodash';
import mapboxgl from 'mapbox-gl';
import supercluster from 'supercluster';
import { featureCollection } from '@turf/helpers';

mapboxgl.accessToken = 'pk.eyJ1Ijoic2Vub2oiLCJhIjoiY2o4eDZha2N6MXcyMjM4bjV6czN5Z2tqbiJ9.t0gGMa732U8ZiGbeihYG4w';

function component() {
  const element = document.createElement('div');
  element.id = 'map'; // Add an id to the div
  element.style.width = '100%'; // Set the width of the div to 100%
  element.style.height = '100vh'; // Set the height of the div to 100% of the viewport height

  return element;
}

document.body.appendChild(component());

// Create a new Mapbox map
var map = new mapboxgl.Map({
  container: 'map', // Use the id of the div you just created
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [-98, 39.5], // Starting position [lng, lat]
  zoom: 4.7 // Starting zoom level
});

// Add this function to your code
function addRainViewerLayer(map, timestamp) {
  // Remove the existing layer if it exists
  if (map.getLayer('rainviewer')) {
    map.removeLayer('rainviewer');
    map.removeSource('rainviewer');
  }

  // Add the RainViewer layer
  map.addSource('rainviewer', {
    type: 'raster',
    tiles: [
      `https://tilecache.rainviewer.com/v2/radar/${timestamp}/256/{z}/{x}/{y}/2/1_1.png`
    ],
    tileSize: 256
  });

  map.addLayer({
    id: 'rainviewer',
    type: 'raster',
    source: 'rainviewer',
    paint: {
      'raster-opacity': 0.7
    }
  });
}

// Get the latest radar data from the RainViewer API
fetch('https://api.rainviewer.com/public/maps.json')
  .then(response => response.json())
  .then(data => {
    // Get the latest timestamp
    const timestamp = data[data.length - 1];

    // Add the RainViewer layer when the map loads
    map.on('load', function () {
      fetch('output.geojson')
      .then(response => response.json())
      .then(geojson => {
        // Create a new Supercluster instance
        var cluster = new supercluster({
          radius: 40,
          maxZoom: 16
        });

        // Load the GeoJSON data into the Supercluster instance
        cluster.load(geojson.features);

        map.addSource('clusters', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [] // We'll fill this in when the map moves
          },
          cluster: true,
          clusterMaxZoom: 14, // Max zoom to cluster points on
          clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
        });

        map.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'clusters',
          paint: {
            // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
            // with three steps to implement three types of circles:
            //   * Blue, 20px circles when point count is less than 100
            //   * Yellow, 30px circles when point count is between 100 and 750
            //   * Pink, 40px circles when point count is greater than or equal to 750
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#51bbd6',
              25,
              '#f1f075',
              100,
              '#f28cb1'
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              10,
              15,
              20,
              25,
              30,
              100,
              40
            ]
          }
        });

        // Update the 'clusters' source with the new features
        map.on('moveend', function() {
          // Get the current map bounds
          var bounds = map.getBounds();

          // Get the features in the current map bounds
          var features = cluster.getClusters([
            bounds.getWest(),
            bounds.getSouth(),
            bounds.getEast(),
            bounds.getNorth()
          ], map.getZoom());

          // Update the 'clusters' source with the new features
          map.getSource('clusters').setData({
            type: 'FeatureCollection',
            features: features
          });
        });

        // Trigger a 'moveend' event to update the clusters immediately
        map.fire('moveend');

      })
      .catch(error => console.error('Error:', error));
      addRainViewerLayer(map, timestamp);

      map.on('zoom', function() {
        // Get the current zoom level
        var zoom = map.getZoom();
      
        // Check if the zoom level is above the threshold
        if (zoom > 10) {
          // Check if the RainViewer layer exists
          if (map.getLayer('rainviewer')) {
            // Remove the RainViewer layer
            map.removeLayer('rainviewer');
            map.removeSource('rainviewer');
          }
        } else {
          // Add the RainViewer layer back if it doesn't exist and the zoom level is below the threshold
          if (!map.getLayer('rainviewer')) {
            addRainViewerLayer(map, timestamp);
          }
        }
      });
    });

    // Update the RainViewer layer every 5 minutes
    setInterval(() => {
      addRainViewerLayer(map, timestamp);
    }, 5 * 60 * 1000);
  });