// Importing the image (low tide condition)
var img = ee.Image("COPERNICUS/S2_SR_HARMONIZED/20220703T132239_20220703T132238_T22JGR");

var vis_rgb = {
  max: 1000,
  bands: ['B4', 'B3', 'B2'], // to visualize in true color
  };
var singleBandVis = {
              //'min': -0.5,
              'max': 1,
              };

Map.addLayer(img, vis_rgb, "TrueColor", false);

function reflec_corr (image){
  var opticalBands = image.select("B.").multiply(0.0001); //applying the scale factor of Sentinel-2 collection
    return image
    .addBands(opticalBands, null, true);
  }

var img1 = reflec_corr(img);
print (img1);
///// Creating geometry to clip every image in the collection for a specific site (Tauranga Harbour) and defining some funtions:
var geometry = ee.Geometry.Polygon(
        [[[-48.74015808105469,-26.37372339295363],
            [-48.65947723388672,-26.37372339295363],
            [-48.65947723388672,-26.31895972813747],
            [-48.74015808105469,-26.31895972813747],
            [-48.74015808105469,-26.37372339295363]]]);
Map.centerObject(geometry, 11);

///// Criating indices functions, cut and mask
var indices = function(image) {
 var ndwi = image.normalizedDifference(['B3', 'B8']).rename ('ndwi'); //Mc Feeters, 1996
 var awei = image.expression('(4 * (G - S)) - (0.25 * N + 2.75 * S) ',{ //Feyisa etal, 2014
   B: image.select('B2'),
   G: image.select('B3'), 
   S: image.select('B11'), 
   N: image.select('B8'),
   }).rename('awei');
   
   return image.addBands([ndwi,awei]);
};

var clip_image = function (image){
  return image.clip(geometry)}; 

var mask_land = function (image){
  return image.updateMask(image.select('ndwi').gte(-0.3))}; 
  
///// Applying the functions
var aweiVis = {
   'max': 150,
   'min': -1100,
};

var NWI = (indices(img1));// calculates the indices  
var NWINoMask=(clip_image(NWI)); 

// Visualize NDWI - no masked histograma
var hist_AWEINoMask = ui.Chart.image.histogram({image:NWINoMask.select('ndwi'), region: geometry, scale: 11})
  .setOptions({title: 'NDWI Histogram no masked'});
print (hist_AWEINoMask);

var NWI=(mask_land(NWINoMask)); //applies the mask
Map.addLayer(NWI.select('ndwi'),singleBandVis, "NDWI-Mask");

// Visualize the NDWI histogram - masked
var hist_NDWI_Mask = ui.Chart.image.histogram({image:NWI.select('ndwi'), region: geometry, scale: 11})
  .setOptions({title: 'NDWI histogram masked'});
print (hist_NDWI_Mask);

var palette = ['blue','yellow'];
var vis_params = {
              'min': 0,
              'max': 0.1,
              'dimensions': 500,
              'palette':palette,             
              };
Map.addLayer(NWI.select('awei'),aweiVis, "AWEI-Mask");

var hist_AWEI_Mask = ui.Chart.image.histogram({image:NWI.select('awei'), region: geometry, scale: 11})
  .setOptions({title: 'AWEI histogram masked'});
print (hist_AWEI_Mask);
var NWI_STD = NWI.select('awei');

var histogram = NWI_STD.reduceRegion({
  reducer: ee.Reducer.histogram(),
  geometry: geometry, 
  scale: 10
});

var AWEI_stdDev = histogram.get('awei');

///// Masking through a value after inspecting the AWEI image
var stdMasked = NWI_STD.updateMask(NWI_STD.gte(-1000)); //EQ("="), GTE(">="), GT(">"), LT("<"), LTE("<=");
var zones=NWI_STD.lte(-1000); 
var zones = zones.updateMask(zones.neq(0));

Map.addLayer(zones, vis_params, 'stdMasked'); 
// print("zones", zones)
// Visualize the histogram after cut
var hist_intermare = stdMasked.reduceRegion({
  reducer: ee.Reducer.histogram(),
  geometry: geometry, 
  scale: 10
});

var hist_intermare = ui.Chart.image.histogram({image:stdMasked, region:geometry, scale:11})
  .setOptions({title: 'Intertidal Histogram'});
print (hist_intermare);

///// Transform to vectors
var vectors = zones.addBands(NWI_STD).reduceToVectors({ 
  //crs: 'EPSG:32760',
  //crsTransform: [60, 0, 399960, 0, -60, 5900020],
  scale: 10,
  geometryType:'polygon',
  labelProperty: 'stdMasked',
  eightConnected: false,
  geometry: geometry,
  maxPixels: 100e9,
  geometryInNativeProjection: true,
  reducer: ee.Reducer.mean()
});

///// Cuting through vectors
var clip_image2 = function(image){
  return image.clip(vectors);
};

var NWI2 = (indices(img1));
print("Clip of the images", NWI2);
var intertidal_zones = (clip_image2(NWI2));

// Displaying
var palette = ['white','blue'];
var vis_params = {
              'min': 0,
              'max': 1,
              'dimensions': 500,
              };
Map.addLayer(intertidal_zones, vis_params, 'AWEI');

//// Export the vetors
var task = Export.table.toDrive({
  collection: vectors,
  description:'Intertidal_Zones_Linguado_AWEI',
  folder: 'Intertidal_Zones',
  fileFormat: 'SHP'});
  
