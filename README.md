# Drought Monitoring Using Google Earth Engine (GEE)

This project contains a JavaScript code to perform drought monitoring using the Google Earth Engine (GEE) platform in the Awash River Basin, Ethiopia. The script calculates vegetation health and temperature indices, including Vegetation Condition Index (VCI), Temperature Condition Index (TCI), and Vegetation Health Index (VHI), to assess drought conditions in the Awash River Basin from 2000 to 2021.

## Features
- Import and filter MODIS NDVI and LST satellite data.
- Calculate and visualize VCI, TCI, and VHI.
- Classify and compute areas affected by different drought severity levels.
- Generate time series charts for VCI, TCI, and VHI.

## Usage
1. Load the script in your GEE environment.
2. Modify the `ROI_1` variable to your region of interest.
3. Adjust the time period by setting the `startyear`, `endyear`, `startmonth`, and `endmonth` variables.
4. The script will generate drought indices and export them as TIFF images.
