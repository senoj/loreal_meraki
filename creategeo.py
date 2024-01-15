import json

# Load the JSON data
with open('response_devices.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Convert to GeoJSON format
geojson = {
    'type': 'FeatureCollection',
    'features': []
}

for item in data:
    if item['productType'] == 'appliance':
        feature = {
            'type': 'Feature',           
            'properties': {
                'serialNumber': item['serial'],
                'name': item['name'],
            },  # or select specific properties
            'geometry': {
                'type': 'Point',
                'coordinates': [item['lng'], item['lat']]
            }
        }
        geojson['features'].append(feature)

# Save the GeoJSON data
with open('output.geojson', 'w') as f:
    json.dump(geojson, f)