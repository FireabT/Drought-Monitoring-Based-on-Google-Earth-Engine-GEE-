# Load necessary libraries
library(dplyr)
library(ggplot2)
library(reshape2)

# Sample data import ("replace with actual file paths")
spi_data <- read.csv("path/to/spi_data.csv")
vci_data <- read.csv("path/to/vci_data.csv")
tci_data <- read.csv("path/to/tci_data.csv")
vhi_data <- read.csv("path/to/vhi_data.csv")

# Ensure data frames have common columns for merging, such as Date and Station ID
merged_data <- spi_data %>%
  inner_join(vci_data, by = c("Date", "Station_ID")) %>%
  inner_join(tci_data, by = c("Date", "Station_ID")) %>%
  inner_join(vhi_data, by = c("Date", "Station_ID"))

# Calculate Pearson correlation for each station
stations <- unique(merged_data$Station_ID)
correlation_results <- data.frame(Station_ID = character(), VCI_SPI = numeric(), TCI_SPI = numeric(), VHI_SPI = numeric(), stringsAsFactors = FALSE)

for (station in stations) {
  station_data <- merged_data %>% filter(Station_ID == station)
  
  vci_spi_cor <- cor(station_data$SPI, station_data$VCI, method = "pearson")
  tci_spi_cor <- cor(station_data$SPI, station_data$TCI, method = "pearson")
  vhi_spi_cor <- cor(station_data$SPI, station_data$VHI, method = "pearson")
  
  correlation_results <- rbind(correlation_results, data.frame(Station_ID = station, VCI_SPI = vci_spi_cor, TCI_SPI = tci_spi_cor, VHI_SPI = vhi_spi_cor))
}

# Print correlation results
print(correlation_results)

# Save results to a CSV file
write.csv(correlation_results, "correlation_results.csv", row.names = FALSE)

# Plot heatmap of the correlation results
correlation_melted <- melt(correlation_results, id.vars = "Station_ID")

ggplot(correlation_melted, aes(x = Station_ID, y = variable, fill = value)) +
  geom_tile() +
  scale_fill_gradient2(low = "blue", mid = "white", high = "red", midpoint = 0, limits = c(-1, 1)) +
  theme_minimal() +
  theme(axis.text.x = element_text(angle = 90, hjust = 1)) +
  labs(title = "Pearson Correlation Between SPI and VCI, TCI, VHI", x = "Station ID", y = "Index", fill = "Correlation")
plot_heatmap(data, "TCI Correlation", "Pearson Correlation Matrix for TCI across Stations")

# Plotting VHI Correlation Heatmap
plot_heatmap(data, "VHI Correlation", "Pearson Correlation Matrix for VHI across Stations")
