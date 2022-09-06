// Identifying the intertidal zone through standard deviation of NDWI images
// Creating the collection
function reflec_corr (image){ // function to apply the scale factor of Sentinel-2 bands
  var opticalBands = image.select("B.").multiply(0.0001);
    return image
    .addBands(opticalBands, null, true);
  }

var img1 = ee.ImageCollection('COPERNICUS/S2_SR')
  .filterDate('2022-07-02', '2022-07-04') //image in low tide condition
  .filterBounds(ee.Geometry.Point([-48.69, -26.32]))
  .map(reflec_corr);

var img2 = ee.ImageCollection('COPERNICUS/S2_SR')
  .filterDate('2022-06-17', '2022-06-19') //image in mean tide condition
  .filterBounds(ee.Geometry.Point([-48.69, -26.32]))
  .map(reflec_corr);
  
var img3 = ee.ImageCollection('COPERNICUS/S2_SR')
  .filterDate('2022-06-12', '2022-06-14') //image in high tide condition
  .filterBounds(ee.Geometry.Point([-48.69, -26.32]))
  .map(reflec_corr);
var Bay_Plenty_collection = img1.merge(img2).merge(img3);

print (Bay_Plenty_collection);
// Creating geometry to clip every image in the collection for a specific site
var geometry = ee.Geometry.Polygon(
        [[[-48.74015808105469,-26.37372339295363],
            [-48.65947723388672,-26.37372339295363],
            [-48.65947723388672,-26.31895972813747],
            [-48.74015808105469,-26.31895972813747],
            [-48.74015808105469,-26.37372339295363]]]);
Map.centerObject(geometry, 11);

// Defining the NDWI, clip and mask funciton
var calculate_NI = function (image) {
  return image.normalizedDifference(['B3','B8']).rename('NDWI')}; // calculate the normalized difference water index (McFeeters, 1996)

var clip_image = function (image){
  return image.clip(geometry)}; // clip the interest area

var mask_land = function (image){
  return image.updateMask(image.lte(0.4))}; // elminiate the values bellow 0.4

// Applying the functions to all collection 
var singleBandVis = {
              'min': -0.05,
              'max': 1,
              };

var NWI = Bay_Plenty_collection.map(calculate_NI);  // calculates de NDWI  
var NWINoMask=NWI.map(clip_image);  // clip

// Histogram visualize 
var hist_NDWINoMask = ui.Chart.image.histogram({image: NWINoMask.first(), region: geometry, scale: 11})
  .setOptions({title: 'First NDWI histogram - no masked'});
print (hist_NDWINoMask);

var NWI=NWINoMask.map(mask_land); // Aplly the mask 
Map.addLayer(NWI.first(),singleBandVis, 'NDWI-Mask');

// NDWI Histogram visualize
var hist_NDWI_Mask = ui.Chart.image.histogram({image: NWI.first(), region: geometry, scale: 11})
  .setOptions({title: 'First NDWI histogram - masked'});
print (hist_NDWI_Mask);

var NWI_STD = NWI.reduce(ee.Reducer.stdDev());  // creat a single image in terms of the standard deviation 
Map.addLayer(NWI_STD, singleBandVis,'STD image');

//NDWI-STD Histogram visualize 
var hist_NDWI_STD = ui.Chart.image.histogram({image: NWI_STD, region: geometry, scale: 11})
  .setOptions({title: 'Std NDWI histogram'});
print (hist_NDWI_STD);

var histogram = NWI_STD.reduceRegion({
  reducer: ee.Reducer.histogram(),
  geometry: geometry, 
  scale: 11
});
var NDWI_stdDev = histogram.get('NDWI_stdDev');

print('histogram list', ee.Number(NDWI_stdDev).getInfo());
print((ee.Dictionary(NDWI_stdDev).get('histogram')));

// Otsu methodology 

var otsu = function(histogram) {
  var counts = ee.Array(ee.Dictionary(NDWI_stdDev).get('histogram'));
  var means = ee.Array(ee.Dictionary(NDWI_stdDev).get('bucketMeans'));
  var size = means.length().get([0]);
  var total = counts.reduce(ee.Reducer.sum(), [0]).get([0]);
  var sum = means.multiply(counts).reduce(ee.Reducer.sum(), [0]).get([0]);
  var mean = sum.divide(total);

  var indices = ee.List.sequence(1, size);
  
// Compute between sum of squares, where each mean partitions the data.
  var bss = indices.map(function(i) {
    var aCounts = counts.slice(0, 0, i);
    var aCount = aCounts.reduce(ee.Reducer.sum(), [0]).get([0]);
    var aMeans = means.slice(0, 0, i);
    var aMean = aMeans.multiply(aCounts)
        .reduce(ee.Reducer.sum(), [0]).get([0])
        .divide(aCount);
    var bCount = total.subtract(aCount);
    var bMean = sum.subtract(aCount.multiply(aMean)).divide(bCount);
    return aCount.multiply(aMean.subtract(mean).pow(2)).add(
          bCount.multiply(bMean.subtract(mean).pow(2)));
  });

  print(ui.Chart.array.values(ee.Array(bss), 0, means));

// Return the mean value corresponding to the maximum BSS.
  return means.sort(bss).get([-1]);
};

var threshold = otsu(histogram.get('histogram'));
print('the threshold is:    ', threshold);

// Masking through the threshold
var palette = ['blue','yellow'];
var vis_params = {
              'min': 0,
              'max': 1,
              'dimensions': 500,
              'palette': palette,             
              };
              
// values higher than threshold will be kept 
var stdMasked = NWI_STD.updateMask(NWI_STD.gte(threshold)); 
var zones=NWI_STD.gte(threshold); 
var zones = zones.updateMask(zones.neq(0));

Map.addLayer(zones, vis_params, 'stdMasked'); 

// After mask histogram

var hist_intermare = ui.Chart.image.histogram({image: stdMasked, region: geometry, scale: 11})
  .setOptions({title: 'Intertidal zone histogram'});
print (hist_intermare);

// Creating vectors
var vectors = zones.addBands(NWI_STD).reduceToVectors({ 
  scale: 10,
  geometryType: 'polygon',
  labelProperty: 'stdMasked',
  eightConnected: false,
  geometry: geometry,
  maxPixels: 100e9,
  geometryInNativeProjection: true,
  reducer: ee.Reducer.mean()
});

// Cliping the images by the vectors
var clip_image2 = function(image){
  return image.clip(vectors);
};

var NWI2 = Bay_Plenty_collection.map(calculate_NI);
print('images clip', NWI2);
var intertidal_zones = NWI2.map(clip_image2);

// Displaying
var palette = ['white','blue'];
var vis_params = {
              'min': 0,
              'max': 1,
              'dimensions': 500,
              'palette': palette,             
              };
Map.addLayer(intertidal_zones, vis_params, 'NDWI');

// Exporting the vectors 
var task = Export.table.toDrive({
  collection: vectors,
  description: 'Intertidal_Zones_std_0041_3img',
  folder: 'Intertidal_Zones',
  fileFormat: 'SHP'});
  
// Exporting images
var ExportCol = function (col, folder, scale, tp, maxPixels, region) {
  scale = 10,
  maxPixels =  100e9;
  
  var nimg=col.size().getInfo();
  var colList = col.toList(nimg);
  var n = colList.size().getInfo();

  for (var i = 0 ; i < n; i++) {
    var img = ee.Image(colList.get(i));
    var id = img.id().getInfo();
    region = region; 

      var imgtype = {'float': img.toFloat(), 
                 'byte': img.toByte(), 
                 'int': img.toInt(),
                 'double': img.toDouble()};

      Export.image.toDrive({
        image: imgtype[tp],
        description: id,
        folder: folder,
        fileNamePrefix: id,
        region: region,
        scale: scale,
        maxPixels: maxPixels}
        )}
};
var task2 = ExportCol(intertidal_zones, 'Intertidal_Zones', 10, 'float', 100e9, geometry);
Export.image.toDrive({
  image: NWI_STD, 
  description: 'NDWI_STD',
  folder: 'Intertidal_Zones', 
  fileNamePrefix: 'img_ndwi_std_0041',
  region: geometry, 
  scale: 10,
  maxPixels: 100e9});
  
