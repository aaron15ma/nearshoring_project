var geojsonLayer; // Declaración global de geojsonLayer

window.onload = function () {
    var basemap = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYWFyb24xNW1hIiwiYSI6ImNseDlodWwwMDEyNWkyaXB6OWduMGg2bXYifQ.icWNvciR1eZCYtMAyYzkrw', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        id: 'mapbox/streets-v11'
    });

    var map = L.map('my-map').setView([30.0, -115.0], 7);
    basemap.addTo(map);

    function getIcon(sector) {
        var iconUrl;
        switch (sector) {
            case 'Industrias manufactureras':
                iconUrl = 'icons/industria.png';
                break;
            case 'Información en medios masivos':
                iconUrl = 'icons/medios.png';
                break;
            case 'Transportes, correos y almacenamiento':
                iconUrl = 'icons/transporte.png';
                break;
            case 'Servicios profesionales, científicos y técnicos':
                iconUrl = 'icons/servicios.png';
                break;
            default:
                iconUrl = 'icons/default.png';
        }

        return L.icon({
            iconUrl: iconUrl,
            iconSize: [50, 50],
            iconAnchor: [25, 50],
            popupAnchor: [0, -50]
        });
    }

    function loadGeoJSON(filter = '') {
        if (geojsonLayer) {
            map.removeLayer(geojsonLayer);
        }
        $.getJSON("map.geojson", function (data) {
            geojsonLayer = L.geoJson(data, {
                pointToLayer: function (feature, latlng) {
                    return L.marker(latlng, { icon: getIcon(feature.properties.SECTOR) });
                },
                onEachFeature: function (feature, layer) {
                    var telefono = feature.properties.TELEFONO || '';
                    var email = feature.properties.EMAIL ? '<p><b>Email:</b> ' + feature.properties.EMAIL + '</p>' : '';
                    
                    var popupContent = '<b>' + feature.properties.NOMBRE + '</b><br>' +
                        '<p><b>Actividad:</b> ' + feature.properties.ACTIVIDAD + '</p>' +
                        '<p><b>Domicilio:</b> ' + feature.properties.DOMICILIO + '</p>';

                    if (telefono) {
                        popupContent += '<p><b>Teléfono:</b> ' + telefono + '</p>';
                    }
                    if (email) {
                        popupContent += email;
                    }

                    layer.bindPopup(popupContent);
                },
                filter: function (feature) {
                    var selectedSectors = $('input[name="sector"]:checked').map(function () {
                        return this.value;
                    }).get();
                    var selectedMunicipios = $('input[name="municipio"]:checked').map(function () {
                        return this.value;
                    }).get();
                    var selectedPersonales = $('input[name="personal"]:checked').map(function () {
                        return this.value;
                    }).get();
                    
                    var isSectorValid = selectedSectors.includes(feature.properties.SECTOR);
                    var isMunicipioValid = selectedMunicipios.includes(feature.properties.MUNICIPIO);
                    var isPersonalValid = selectedPersonales.includes(feature.properties.PERSONAL);

                    var isNameMatch = feature.properties.NOMBRE.toLowerCase().includes(filter.toLowerCase()) ||
                                      feature.properties.ACTIVIDAD.toLowerCase().includes(filter.toLowerCase());

                    return (isSectorValid && isMunicipioValid && isPersonalValid && (filter === '' || isNameMatch));
                }
            });

            geojsonLayer.addTo(map);
            var bounds = geojsonLayer.getBounds();
            if (bounds.isValid()) {
                map.fitBounds(bounds);
            }
        }).fail(function () {
            console.error("Error al cargar el archivo GeoJSON");
        });
    }

    loadGeoJSON();

    $('#consultar').on('click', function () {
        var searchFilter = $('#search-box').val();
        loadGeoJSON(searchFilter);
    });

    $('#reset').on('click', function () {
        $('input[type="checkbox"]').prop('checked', true);
        $('#search-box').val('');
        loadGeoJSON();
    });

    $('#download').on('click', downloadCSV); // Asegúrate de que este evento esté aquí

    $('#search-box').on('input', function () {
        var searchFilter = $(this).val();
        loadGeoJSON(searchFilter);
    });
};

function downloadCSV() {
    if (!geojsonLayer) {
        console.error("geojsonLayer no está definido");
        return;
    }
    var csvData = [];
    var headers = ['NOMBRE', 'ACTIVIDAD', 'DOMICILIO', 'TELEFONO', 'SECTOR'];
    csvData.push(headers.join(','));

    geojsonLayer.eachLayer(function (layer) {
        var properties = layer.feature.properties;
        var row = [
            properties.NOMBRE,
            properties.ACTIVIDAD,
            properties.DOMICILIO,
            properties.TELEFONO,
            properties.SECTOR
        ];
        csvData.push(row.join(','));
    });

    var csvString = csvData.join('\n');
    var blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement("a");
    var url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "Datos BC.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
