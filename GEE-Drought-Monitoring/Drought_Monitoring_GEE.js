//Drought-Monitoring-Based-on-Google-Earth-Engine-GEE
var NDVI: ImageCollection "MOD1301.006 Terra Vegetation Indices 16-Day Global 250m" 
var LST: ImageCollection "MOD11A2.006 Terra Land Surface Temperature and Emissivity 8-Day Global 1km"
var ROI_1: Table projects/ee-freabtenaye/assets/awash_river_basin
Map.centerObject(ROI_1, 5)

var startyear = 2000
var endyear = 2021

var startmonth = 7
var endmonth = 9

var startDate = ee.Date.fromYMD(startyear, startmonth, 1);
var endDate = ee.Date.fromYMD(endyear, endmonth, 30);

var filterNDVI = NDVI.filterDate(startDate, endDate)
.filterBounds(ROI_1)

.select('NDVI')

print('NDVI', filterNDVI);

// Filter LST
var filterLST = LST
  .filterDate(startDate, endDate)
  .filterBounds(ROI_1)
  .select('LST_Day_1km')
  .map(function (img) {
    return img.set('date', img.date().format('YYYY_MM_dd'));
  });


var add_dn_date = function(img, beginDate, IncludeYear, n){
beginDate = beginDate || img.get('system:time_start');
if (IncludeYear === undefined) { IncludeYear = true; }
n = n || 8;

beginDate = ee.Date(beginDate);
var year = beginDate.get('year');


var diff = beginDate.difference(ee.Date.fromYMD(year, 1, 1), 'day').add(1);
var dn = diff.subtract(1).divide(n).floor().add(1).int();

var yearstr = year.format('%d'); //ee.String(year);
dn = dn.format('%02d'); //ee.String(dn);
dn = ee.Algorithms.If(IncludeYear, yearstr.cat("-").cat(dn), dn);

return ee.Image(img)
.set('system:time_start', beginDate.millis())
.set('date', beginDate.format('yyyy-MM-dd')) // system:id
.set('year', yearstr)
.set('month', beginDate.format('MM'))
.set('yearmonth', beginDate.format('YYYY-MM'))
.set('dn', dn); //add dn for aggregated into 8days
}


var add_dn= function(IncludeYear, n) {
if (typeof IncludeYear === 'undefined') { IncludeYear = true; }
if (typeof n === 'undefined') { n = 8; }
return function (img) {
return add_dn_date(img, img.get('system:time_start'), IncludeYear, n);
};
}

var imgcol_last = function(imgcol, n) {
n = n || 1;
// ee.Image(imgcol_grace.reduce(ee.Reducer.last())); properties are missing
var res = imgcol.toList(n, imgcol.size().subtract(n));
if (n <= 1) { res = ee.Image(res.get(0)); }
return res;
}

var copyProperties = function(source, destination, properties) {
// properties = properties || ['system:time_start']; // , 'system:id'
properties = properties || destination.propertyNames();
return source.copyProperties(destination)
.copyProperties(destination, properties);
};

var check_aggregate = function(bandList, reducerList, ImgCol) {
function check_list(x) {
if (!Array.isArray(x)) x = [x];
return x;
}

reducerList = reducerList || ['mean'];
bandList = bandList || ImgCol.first().bandNames();

reducerList = check_list(reducerList);
bandList = check_list(bandList);

if (bandList.length === 1 && reducerList.length > 1) {
temp = bandList[0];
bandList = [];
reducerList.forEach(function (reducer, i) {
bandList.push(temp);
});
}
return { bandList: bandList, reducerList: reducerList };
}

var aggregate_process = function (ImgCol, prop, prop_val, bandList, reducerList, delta) {
var nreducer = reducerList.length;
var imgcol = ImgCol.filterMetadata(prop, 'equals', prop_val).sort('system:time_start');

var first = ee.Image(imgcol.first());
var last = imgcol_last(imgcol);

var ans = ee.Image([]);
if (!delta) {
for (var i = 0; i < nreducer; i++) {
var bands = bandList[i];
var reducer = reducerList[i];
var img_new = imgcol.select(bands).reduce(reducer);
ans = ans.addBands(img_new);
}
} else {
ans = last.subtract(first);
}
return copyProperties(ee.Image(ans), first);
}

var aggregate_prop = function (ImgCol, prop, reducerList, bandList, delta) {
if (delta === undefined) { delta = false; }
var dates = ee.Dictionary(ImgCol.aggregate_histogram(prop)).keys();
var options = check_aggregate(bandList, reducerList, ImgCol);

function process(prop_val) {
return aggregate_process(ImgCol, prop, prop_val,
options.bandList, options.reducerList, delta);
}

var ImgCol_new = dates.map(process);
var bands = ee.List(options.bandList).flatten();

var out = ee.ImageCollection(ImgCol_new);
if (options.reducerList.length === 1) {
out = out.select(ee.List.sequence(0, bands.length().subtract(1)), bands);
}
return out;
};


filterLST = filterLST.map(add_dn(true, 16))
print ('orig LST', filterLST)

var lst16days = aggregate_prop(filterLST, "dn", 'mean');
print ('LST',lst16days);

var scaledNDVI = filterNDVI.map(function(img){
return img.multiply(0.0001)
.copyProperties(img,['system:time_start','system:time_end']);
});

var scaledLST = lst16days.map(function(img){
return img.multiply(0.02).subtract(273.15)
.copyProperties(img,['system:time_start','system:time_end']);
});

var VCI = scaledNDVI.map(function(image){
var Imin = scaledNDVI.reduce(ee.Reducer.min())
var Imax =scaledNDVI.reduce(ee.Reducer.max())
return image.expression('(Ia-Imin)/(Imax-Imin)*100',
{Ia: image,
Imin: Imin,
Imax:Imax
}).clip(ROI_1).rename('VCI')
.copyProperties(image, ['system:time_start','system:time_end'])
})
print ('VCI',VCI)

var TCI = scaledLST.map(function(image){
var Imin = scaledLST.reduce(ee.Reducer.min())
var Imax =scaledLST.reduce(ee.Reducer.max())
return image.expression('(Imax-Ia)/(Imax-Imin)*100',
{Ia: image,
Imin: Imin,
Imax:Imax
}).clip(ROI_1).rename('TCI')
.copyProperties(image, ['system:time_start','system:time_end'])
.set('date', image.date().format('YYYY_MM_dd'))
})
print ('TCI',TCI)

var assets = require('users/gena/packages:palettes')

var VisParams = {
min: 0,
max:100,
palette: assets.colorbrewer.RdYlGn[9]}

Map.addLayer(VCI,VisParams ,'VCI')
Map.addLayer(TCI,VisParams, 'TCI')

var filter = ee.Filter.equals({
leftField: 'system:time_start',
rightField: 'system:time_start'
});
var join = ee.Join.saveFirst({
matchKey: 'match',
});


var both = ee.ImageCollection(join.apply(VCI,TCI,filter))
.map(function(image) {
return image.addBands(image.get('match'))
.set('date', image.date().format('YYYY_MM_dd'));
});

var VHI= both.map(function(img) {
return img.addBands(
img.expression('a1/2 + b1', {
a1: img.select('VCI'),
b1: img.select('TCI'),
}).rename('VHI')).select('VHI');
});

print('VHI',VHI);
Map.addLayer(VHI, VisParams,'VHI')

// Define a function to classify drought based on thresholds
var classifyDrought = function(image, indexName) {
  var noDrought = image.gt(70).rename(indexName + '_noDrought');
  var mildDrought = image.gt(50).and(image.lte(70)).rename(indexName + '_mildDrought');
  var moderateDrought = image.gte(30).and(image.lte(50)).rename(indexName + '_moderateDrought');
  var severeDrought = image.gte(20).and(image.lt(30)).rename(indexName + '_severeDrought');
  var extremeDrought = image.lt(20).rename(indexName + '_extremeDrought');
  
  return ee.Image.cat([noDrought, mildDrought, moderateDrought, severeDrought, extremeDrought])
               .selfMask();  // Masking to make sure only valid areas are used
};

// Function to compute the area of each drought category in square kilometers
var computeDroughtArea = function(image, indexName) {
  var areaImage = ee.Image.pixelArea().divide(1e6); // Convert to square kilometers

  var droughtClassified = classifyDrought(image, indexName);

  // Compute the total area for each drought category
  var categories = [indexName + '_noDrought', indexName + '_mildDrought', indexName + '_moderateDrought', 
                    indexName + '_severeDrought', indexName + '_extremeDrought'];
                    
  var areas = categories.map(function(category) {
    var categoryMask = droughtClassified.select(category).eq(1); // Mask for the specific category
    var categoryArea = areaImage.updateMask(categoryMask)
                              .reduceRegion({
                                reducer: ee.Reducer.sum(),
                                geometry: ROI_1,
                                scale: 250,
                                maxPixels: 1e13
                              }).get('area');
    return categoryArea || 0;  // Default to 0 if no area is found
  });

  return ee.Dictionary.fromLists(categories, areas);
};

// Compute drought areas for VCI, TCI, and VHI
var VCI_areas = computeDroughtArea(VCI.mean().clip(ROI_1), 'VCI');
var TCI_areas = computeDroughtArea(TCI.mean().clip(ROI_1), 'TCI');
var VHI_areas = computeDroughtArea(VHI.mean().clip(ROI_1), 'VHI');

// Print the results
print('VCI Drought Areas (sq. km)', VCI_areas);
print('TCI Drought Areas (sq. km)', TCI_areas);
print('VHI Drought Areas (sq. km)', VHI_areas);




// Time series Chart

//VCI Time Series 
var VCI_TS_CHART = Chart.image.seriesByRegion(VCI, ROI_1, ee.Reducer.mean(),'VCI', 1000, 'system:time_start').setOptions({
title: 'VCI Time Series (' + startyear.toString() + '-' + endyear.toString() + ')',
vAxis: {title: 'VCI Index'},
});
print(VCI_TS_CHART);


//TCI Time Series 
var TCI_TS_CHART = Chart.image.seriesByRegion(TCI, ROI_1, ee.Reducer.mean(),'TCI', 1000, 'system:time_start').setOptions({
title: 'TCI Time Series (' + startyear.toString() + '-' + endyear.toString() + ')',
vAxis: {title: 'TCI Index'},
});
print(TCI_TS_CHART);

//VHI Time Series 
var VHI_TS_CHART = Chart.image.seriesByRegion(VHI, ROI_1, ee.Reducer.mean(),'VHI', 1000, 'system:time_start').setOptions({
title: 'VHI Time Series (' + startyear.toString() + '-' + endyear.toString() + ')',
vAxis: {title: 'VHI Index'},
});
print(VHI_TS_CHART);

// Export this tiff image

Export.image.toDrive({
  image:VHI.mean().clip(ROI_1) , 
  description:'VHI_2007', 
  folder:'Awash_River_basin',  
  region: ROI_1 , 
  scale: 250,  
  maxPixels: 1e13})

Export.image.toDrive({
  image:VCI.mean().clip(ROI_1) , 
  description:'VCI_2007', 
  folder:'Awash_River_basin',  
  region: ROI_1 , 
  scale: 250,  
  maxPixels: 1e13})
  
Export.image.toDrive({
  image:TCI.mean().clip(ROI_1) , 
  description:'TCI_2007', 
  folder:'Awash_River_basin',  
  region: ROI_1 , 
  scale: 250,  
  maxPixels: 1e13})
