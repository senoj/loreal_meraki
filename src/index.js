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
  style: 'mapbox://styles/mapbox/standard',
  center: [-74.5, 40], // Starting position [lng, lat]
  zoom: 9 // Starting zoom level
});

var geojson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-74.5, 40] // [lng, lat]
      },
      properties: {
        title: 'Point 1',
        description: 'Description 1'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-74.6, 40.1] // [lng, lat]
      },
      properties: {
        title: 'Point 2',
        description: 'Description 2'
      }
    },
    // Add more points as needed
  ]
}

// Create a new Supercluster instance
var cluster = new supercluster({
  radius: 40,
  maxZoom: 16
});

// Load the GeoJSON data into the Supercluster instance
cluster.load(geojson.features);

map.on('load', function () {
  // Function to update the clusters
  function updateClusters() {
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
    map.getSource('clusters').setData(featureCollection(features));
  }

  // Add the features to the map as a new source
  map.addSource('clusters', {
    type: 'geojson',
    data: null // Initialize with no data
  });

  // Add a new layer for the clusters
  map.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'clusters',
    paint: {
      'circle-radius': 10,
      'circle-color': '#007cbf'
    }
  });

  // Update the clusters
  updateClusters();

  // Update the clusters whenever the map bounds or zoom level changes
  map.on('moveend', updateClusters);
});