# Drought Monitoring

This repository contains two different approaches for monitoring drought:

1. **Google Earth Engine (GEE) Drought Monitoring**:  
   This folder contains JavaScript code (`drought_monitoring_gee.js`) that utilizes GEE to compute drought indices such as VCI, TCI, and VHI using MODIS satellite data. The analysis focuses on the Awash River Basin from 2000 to 2021.

2. **In-Situ Data Drought Monitoring**:  
   This folder contains R scripts for analyzing rainfall data and calculating the Standardized Precipitation Index (SPI) using in-situ data from meteorological stations:
   - `impute_fill_rainfall_data.R`: Script for filling missing rainfall data using the MICE imputation method.
   - `spi_calculation.R`: Script for calculating the SPI3 drought index based on rainfall data.
3. **Correlation for Drought Indices**:  
   This folder contains an R script `plot_correlation_heatmaps.R` to visualize Pearson correlation matrices for VCI, TCI, and VHI using heatmaps. The script uses `ggplot2` and `reshape2` libraries to create visually intuitive correlation heatmaps for each index across different stations.

## How to Use
1. Clone the repository or download the scripts.
2. For GEE analysis, load the JavaScript code into the Google Earth Engine platform.
3. For in-situ data analysis, run the R scripts in your local R environment.
