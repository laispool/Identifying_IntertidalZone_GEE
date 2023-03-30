/*
Definição da zona de intermaré a partir do desvio padrão da refletãncia NDWI das imagens
Zona de intermaré = maior desvio padrão (definir limiar)
Metodologia retirada de Costa etal 2021
*/
///// Criação da geometria - Canal do Linguado
// EXIBIÇÃO INDIVIDUAL
var img1 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
  .filterDate('2022-07-02', '2022-07-04')//nível baixo
  .filterBounds(ee.Geometry.Point([-48.69, -26.32]));
 // .filter('CLOUDY_PIXEL_PERCENTAGE < 5');

var img2 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
  .filterDate('2022-06-17', '2022-06-19')//nível médio
  .filterBounds(ee.Geometry.Point([-48.69, -26.32]));
  //.filter('CLOUDY_PIXEL_PERCENTAGE < 5');

var img3 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
  .filterDate('2022-06-12', '2022-06-14')//nível alto
  .filterBounds(ee.Geometry.Point([-48.69, -26.32]));
  //.filter('CLOUDY_PIXEL_PERCENTAGE < 5');
var Bay_Plenty_collection = img1.merge(img2).merge(img3);

var vis_rgb = {
  max: 1000,
  bands: ['B4', 'B3', 'B2'], // to visualize in true color
  };
Map.addLayer(img3, vis_rgb, "TrueColor_nível alto");
Map.addLayer(img1, vis_rgb, "TrueColor_nível baixo");
print (Bay_Plenty_collection);

///// Creating geometry to clip every image in the collection for a specific site (Tauranga Harbour) and defining some funtions:
var geometry = ee.Geometry.Polygon(
        [[[-48.66698111770477, -26.217834109172216],
          [-48.66698111770477, -26.220750466732355],
          [-48.66201366660919, -26.220750466732355],
          [-48.66201366660919, -26.217834109172216]]]);
Map.centerObject(geometry, 15);

///// Criando funções NDWI, corte e máscara
var calculate_NI = function (image) {
  return image.normalizedDifference(['B3','B8']).rename('ndwi')};
// calcula o índice de água normalizado
var clip_image = function (image){
  return image.clip(geometry)}; 
  // corta para a área de interesse

var mask_land = function (image){
  return image.updateMask(image.gte(-0.4))}; 
  // deixa apenas valores maiores ou iguais a -0.4
  
///// Aplicando as funções para a coleção
var singleBandVis = {
              'min': 0,
              'max': 0.1,
              };

var NWI = Bay_Plenty_collection.map(calculate_NI);// calcula o NDWI;  
var NWINoMask=NWI.map(clip_image); // Faz o corte
//Map.addLayer(NWINoMask.first(),singleBandVis, "NDWI-NoMask"); // exibe primeira imagem do NDWI
// Visualizar NDWI - no mask histograma
var hist_NDWINoMask = ui.Chart.image.histogram({image:NWINoMask.first(), region: geometry, scale: 11})
  .setOptions({title: 'Histograma primeiro NDWI sem máscara'});
print (hist_NDWINoMask);

var NWI=NWINoMask.map(mask_land); // aplica máscara a aprtir do valor do histograma
Map.addLayer(NWI.first(),singleBandVis, "NDWI-Mask");
// Visualizar NDWI histograma
var hist_NDWI_Mask = ui.Chart.image.histogram({image:NWI.first(), region: geometry, scale: 11})
  .setOptions({title: 'Histograma primeiro NDWI com máscara'});
print (hist_NDWI_Mask);

var NWI_STD = NWI.reduce(ee.Reducer.stdDev()); // Agora só tem uma imagem que mostra o STD dos NDWI
Map.addLayer(NWI_STD, singleBandVis,'STD image');

var palette = ['blue','yellow'];
var vis_params = {
              'min': 0,
              'max': 0.1,
              'dimensions': 500,
              'palette':palette,             
              };
var hist_NDWI_STD = ui.Chart.image.histogram({image:NWI_STD, region:geometry, scale:11})
  .setOptions({title: 'Histograma NDWI STD'});
print (hist_NDWI_STD);
/* PARTE SEM USAR OTSU
Desvio padrão - single image
// reduzir a coleção em termos do desvio padrão para cada pixel
var NWI_STD = NWI.reduce(ee.Reducer.stdDev()); // Agora só tem uma imagem que mostra o STD dos NDWI
Map.addLayer(NWI_STD, singleBandVis,'STD image');

// Visualizar NDWI-STD histograma
var hist_NDWI_STD = ui.Chart.image.histogram({image:NWI_STD, region:geometry, scale:11})
  .setOptions({title: 'Histograma NDWI STD'});
print (hist_NDWI_STD);
print('até aqui Ok');
///// Máscara a aprtir do histograma do desvio pasdrão
var palette = ['blue','yellow'];

              
// valores maiores que X*STD (retirar X do histograma do NWI_STD)
var stdMasked = NWI_STD.updateMask(NWI_STD.gte(0.060)); //EQ("="), GTE(">="), GT(">"), LT("<"), LTE("<=");
var zones=NWI_STD.gte(0.060); // 0.217 is mean value from the histogram
var zones = zones.updateMask(zones.neq(0));
//print("zones...", zones);
Map.addLayer(zones, vis_params, 'stdMasked'); 
// print("zones", zones)
// Visualizar histograma pós corte

var hist_intermare = ui.Chart.image.histogram({image:stdMasked, region:geometry, scale:11})
  .setOptions({title: 'Histograma intermaré'});
print (hist_intermare);
*/

// UTILIZANDO A METODOLOGIA DE THRESHOLD OTSU:
var histogram = NWI_STD.reduceRegion({
  reducer: ee.Reducer.histogram(),
  geometry: geometry, 
  scale: 10
});
var NDWI_stdDev = histogram.get('ndwi_stdDev');

print('lista do histograma', ee.Number(NDWI_stdDev).getInfo());
print((ee.Dictionary(NDWI_stdDev).get('histogram')));

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

var palette = ['blue','yellow'];
var vis_params = {
              'min': 0,
              'max': 1,
              'dimensions': 500,
              'palette':palette,             
              };
              
///// Máscara a partir do histograma do desvio pasdrão
// valores maiores que X*STD (retirar X do histograma do NWI_STD)
var stdMasked = NWI_STD.updateMask(NWI_STD.gte(threshold)); //EQ("="), GTE(">="), GT(">"), LT("<"), LTE("<=");
var zones=NWI_STD.gte(threshold); // 0.217 is mean value from the histogram
var zones = zones.updateMask(zones.neq(0));
//print("zones...", zones);
Map.addLayer(zones, vis_params, 'stdMasked'); 
// print("zones", zones)
// Visualizar histograma pós corte

var hist_intermare = stdMasked.reduceRegion({
  reducer: ee.Reducer.histogram(),
  geometry: geometry, 
  scale: 10
});
print ('novo histograma', hist_intermare);
var NDWI_stdDev = hist_intermare.get('ndwi_stdDev');

var hist_intermare = ui.Chart.image.histogram({image:stdMasked, region:geometry, scale:11})
  .setOptions({title: 'Histograma intermaré'});
print (hist_intermare);

///// Transformar para vetores
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
//print("número de vetores identificados: ", (vectors.getInfo())); 

///// Função para cortar de acordo com os vetores
var clip_image2 = function(image){
  return image.clip(vectors);
};

var NWI2 = Bay_Plenty_collection.map(calculate_NI);
print("Clip das imagens", NWI2);
var intertidal_zones = NWI2.map(clip_image2);

// Displaying
var palette = ['white','blue'];
var vis_params = {
              'min': 0,
              'max': 1,
              'dimensions': 500,
              'palette':palette,             
              };
Map.addLayer(intertidal_zones, vis_params, 'intertidal_zones');

//// Exportar vetores
var task = Export.table.toDrive({
  collection: vectors,
  description:'Intertidal_Zones_std_003_3img_SulLinguado',
  folder: 'Intertidal_Zones',
  fileFormat: 'SHP'});
  
//// Exportar imagens
var ExportCol = function (col, folder, scale, tp, maxPixels, region) {
  scale = 10,
  maxPixels =  100e9;
  
  var nimg=col.size().getInfo();
  var colList = col.toList(nimg);
  var n = colList.size().getInfo();

  for (var i = 0 ; i < n; i++) {
    var img = ee.Image(colList.get(i));
    var id = img.id().getInfo();
    region = region; // img.geometry().bounds().getInfo()["coordinates"];

      var imgtype = {"float":img.toFloat(), 
                 "byte":img.toByte(), 
                 "int":img.toInt(),
                 "double":img.toDouble()};

      Export.image.toDrive({
        image:imgtype[tp],
        description: id,
        folder: folder,
        fileNamePrefix: id,
        region: region,
        scale: scale,
        maxPixels: maxPixels}
        )}
};
var task2 = ExportCol(intertidal_zones, 'Intertidal_Zones', 11, 'float', 100e9, geometry);
Export.image.toDrive({
  image: NWI_STD, 
  description:'NDWI_STD',
  folder: 'Intertidal_Zones', 
  fileNamePrefix:'img_ndwi_std_003_SulLinguado',
  region:geometry, 
  scale: 10,
  maxPixels: 100e9});
  
