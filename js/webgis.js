/* ===== WebGIS - GIS Lab Group 2 ===== */

// === Basemaps ===
const osmLayer = new ol.layer.Tile({
    title: 'OpenStreetMap',
    type: 'base',
    visible: true,
    source: new ol.source.OSM()
});

const cartoLayer = new ol.layer.Tile({
    title: 'CartoDB Positron',
    type: 'base',
    visible: false,
    source: new ol.source.XYZ({
        url: 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        attributions: '&copy; CARTO &copy; OSM'
    })
});

const satelliteLayer = new ol.layer.Tile({
    title: 'Satellite',
    type: 'base',
    visible: false,
    source: new ol.source.XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attributions: '&copy; Esri, Maxar, Earthstar Geographics'
    })
});

// === Province Boundaries (from data.js) ===
const provinceStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({ color: '#e74c3c', width: 2 }),
    fill: new ol.style.Fill({ color: 'rgba(231,77,89,0.04)' })
});

const provinceHighlightStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({ color: '#f8c630', width: 3 }),
    fill: new ol.style.Fill({ color: 'rgba(248,198,48,0.15)' })
});

const provinceLayer = new ol.layer.VectorImage({
    title: 'Province Boundaries',
    visible: true,
    source: new ol.source.Vector({
        features: new ol.format.GeoJSON().readFeatures(GEOJSON_NETHERLANDS_PROVINCES, {
            featureProjection: 'EPSG:3857'
        })
    }),
    style: provinceStyle
});

// === AMAC WMS ===
const amacLayer = new ol.layer.Tile({
    title: 'AMAC (PM2.5 Change)',
    visible: true,
    opacity: 0.85,
    source: new ol.source.TileWMS({
        url: 'http://localhost:8088/geoserver/gis_lab_group2/wms',
        params: { LAYERS: 'gis_lab_group2:amac_raster', TILED: true, FORMAT: 'image/png' },
        serverType: 'geoserver',
        crossOrigin: 'anonymous'
    })
});

// === LCC WMS ===
const lccLayer = new ol.layer.Tile({
    title: 'LCC (Land Cover Change)',
    visible: true,
    opacity: 0.75,
    source: new ol.source.TileWMS({
        url: 'http://localhost:8088/geoserver/gis_lab_group2/wms',
        params: { LAYERS: 'gis_lab_group2:lcc_raster', TILED: true, FORMAT: 'image/png' },
        serverType: 'geoserver',
        crossOrigin: 'anonymous'
    })
});

// === Map ===
const map = new ol.Map({
    target: 'map',
    layers: [osmLayer, cartoLayer, satelliteLayer, provinceLayer, amacLayer, lccLayer],
    view: new ol.View({
        center: ol.proj.fromLonLat([5.5, 52.2]),
        zoom: 8,
        minZoom: 6,
        maxZoom: 18
    }),
    controls: [
        new ol.control.ScaleLine({ units: 'metric' }),
        new ol.control.FullScreen(),
        new ol.control.MousePosition({
            coordinateFormat: function(coords) {
                const ll = ol.proj.toLonLat(coords);
                return 'Lon: ' + ll[0].toFixed(4) + '° | Lat: ' + ll[1].toFixed(4) + '°';
            },
            projection: 'EPSG:4326',
            className: 'custom-mouse-position'
        }),
        new ol.control.Zoom()
    ]
});

// === Basemap Switcher ===
function setBaseLayer(name) {
    [osmLayer, cartoLayer, satelliteLayer].forEach(function(layer) {
        layer.setVisible(layer.get('title') === name);
    });
}

// === Layer Toggle ===
const layerMap = {
    'Province Boundaries': provinceLayer,
    'AMAC (PM2.5 Change)': amacLayer,
    'LCC (Land Cover Change)': lccLayer
};
function toggleLayer(name, visible) {
    if (layerMap[name]) layerMap[name].setVisible(visible);
}

// === Highlight Province on Hover ===
const highlightOverlay = new ol.layer.Vector({
    source: new ol.source.Vector(),
    style: new ol.style.Style({
        stroke: new ol.style.Stroke({ color: '#f8c630', width: 3 }),
        fill: new ol.style.Fill({ color: 'rgba(248,198,48,0.15)' })
    }),
    zIndex: 10
});
map.addLayer(highlightOverlay);

let highlightFeature = null;

map.on('pointermove', function(evt) {
    const feature = map.forEachFeatureAtPixel(evt.pixel, function(f) {
        if (f.get('NAME_1')) return f;
    });
    if (feature !== highlightFeature) {
        highlightFeature = feature;
        highlightOverlay.getSource().clear();
        if (feature) {
            highlightOverlay.getSource().addFeature(feature.clone());
        }
        map.getTargetElement().style.cursor = feature ? 'pointer' : '';
    }
});

// === Popup ===
const popupContainer = document.createElement('div');
popupContainer.className = 'ol-popup';
popupContainer.innerHTML = '<a href="#" id="popup-closer" class="ol-popup-closer">&times;</a><div id="popup-content"></div>';
document.body.appendChild(popupContainer);

const popupContent = document.getElementById('popup-content');
const popupCloser = document.getElementById('popup-closer');

const popupOverlay = new ol.Overlay({
    element: popupContainer,
    positioning: 'bottom-center',
    stopEvent: false,
    offset: [0, -10]
});
map.addOverlay(popupOverlay);

popupCloser.addEventListener('click', function(e) {
    e.preventDefault();
    popupOverlay.setPosition(undefined);
    return false;
});

// === Click: Province Info + WMS Query ===
map.on('singleclick', function(evt) {
    const feature = map.forEachFeatureAtPixel(evt.pixel, function(f) {
        return f;
    });

    const coord = ol.proj.toLonLat(evt.coordinate);
    let html = '<table style="width:100%;border-collapse:collapse;">';
    html += '<tr><td style="padding:2px 6px;font-weight:600;color:#1a5276;">Lon</td><td>' + coord[0].toFixed(4) + '°</td></tr>';
    html += '<tr><td style="padding:2px 6px;font-weight:600;color:#1a5276;">Lat</td><td>' + coord[1].toFixed(4) + '°</td></tr>';

    if (feature) {
        const props = feature.getProperties();
        for (const key in props) {
            if (key === 'geometry') continue;
            let val = props[key];
            if (val === null || val === undefined) val = '';
            html += '<tr><td style="padding:2px 6px;font-weight:600;color:#2d6e49;">' + key + '</td><td style="padding:2px 6px;">' + val + '</td></tr>';
        }
    }

    // Query WMS
    const viewRes = map.getView().getResolution();
    const amacUrl = amacLayer.getSource().getGetFeatureInfoUrl(evt.coordinate, viewRes, 'EPSG:4326', { INFO_FORMAT: 'text/html', FEATURE_COUNT: 1 });
    const lccUrl = lccLayer.getSource().getGetFeatureInfoUrl(evt.coordinate, viewRes, 'EPSG:4326', { INFO_FORMAT: 'text/html', FEATURE_COUNT: 1 });

    let pending = 0;
    if (amacUrl) pending++;
    if (lccUrl) pending++;
    if (pending === 0) { popupContent.innerHTML = html; popupOverlay.setPosition(evt.coordinate); return; }

    function done() {
        pending--;
        if (pending === 0) { popupContent.innerHTML = html; popupOverlay.setPosition(evt.coordinate); }
    }

    if (amacUrl) {
        fetch(amacUrl).then(r => r.text()).then(text => {
            const m = text.match(/<td[^>]*>([^<]+)<\/td>/g);
            if (m && m.length >= 2) {
                const val = m[m.length - 1].replace(/<\/?td[^>]*>/g, '').trim();
                html += '<tr><td style="padding:2px 6px;font-weight:600;color:#1a5276;">PM₂.₅ Change</td><td>' + (val !== 'nan' && val !== '' ? parseFloat(val).toFixed(3) + ' µg/m³' : 'No data') + '</td></tr>';
            }
        }).catch(function(){}).finally(done);
    }

    if (lccUrl) {
        fetch(lccUrl).then(r => r.text()).then(text => {
            const m = text.match(/<td[^>]*>([^<]+)<\/td>/g);
            if (m && m.length >= 2) {
                const val = m[m.length - 1].replace(/<\/?td[^>]*>/g, '').trim();
                html += '<tr><td style="padding:2px 6px;font-weight:600;color:#1a5276;">LCC Code</td><td>' + (val !== '0' && val !== '' ? val : 'No data') + '</td></tr>';
            }
        }).catch(function(){}).finally(done);
    }

    popupContent.innerHTML = html;
    popupOverlay.setPosition(evt.coordinate);
});
