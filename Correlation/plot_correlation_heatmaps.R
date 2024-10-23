install.packages("readxl")  # For reading Excel files
install.packages("ggplot2") # For plotting
install.packages("reshape2") # For reshaping data
# Load necessary libraries
library(readxl)
library(ggplot2)
library(reshape2)

# Read the Excel file (replace 'your_file.xlsx' with the path to your file)
data <- read_excel("read_file_directory", sheet = "Sheet1")

# Function to plot heatmap
plot_heatmap <- function(data, correlation_column, title) {
  data_melt <- melt(data, id.vars = "Station", measure.vars = correlation_column)
  ggplot(data_melt, aes(x = Station, y = variable, fill = value)) +
    geom_tile(color = "white") +
    scale_fill_gradient2(low = "blue", high = "red", mid = "white", midpoint = 0, limit = c(-1, 1), space = "Lab", name="Pearson\nCorrelation") +
    geom_text(aes(label = round(value, 2)), color = "black", size = 4) +
    theme_minimal() +
    theme(axis.text.x = element_text(angle = 45, hjust = 1)) +
    ggtitle(title)
}

# Plotting VCI Correlation Heatmap
plot_heatmap(data, "VCI Correlation", "Pearson Correlation Matrix for VCI across Stations")

# Plotting TCI Correlation Heatmap
plot_heatmap(data, "TCI Correlation", "Pearson Correlation Matrix for TCI across Stations")

# Plotting VHI Correlation Heatmap
plot_heatmap(data, "VHI Correlation", "Pearson Correlation Matrix for VHI across Stations")
