# Install and load necessary packages
library(SPEI)
library(dplyr)
library(tidyr)
library(readr)
library(stringr)

# Define a function to read and prepare data from one CSV file
read_and_prepare_data <- function(file_path) {
  data <- read_csv(file_path, show_col_types = FALSE)
  data <- data %>%
    pivot_longer(cols = -Year, names_to = "Month", values_to = "Precipitation") %>%
    mutate(
      # Retain Month as character without converting to number
      Date = as.Date(paste(Year, Month, "01", sep = "-"), format = "%Y-%b-%d")  # %b for abbreviated month names
    ) %>%
    arrange(Date)
  return(data)
}

# List all CSV files
file_paths <- list.files("read_file_directory", pattern = "*.csv", full.names = TRUE)

# Read and prepare all data
data_list <- lapply(file_paths, read_and_prepare_data)

# Combine all data into one data frame and add a Site column
combined_data <- bind_rows(data_list, .id = "Site")

# Convert Site column to character to avoid issues in pivot_longer
combined_data$Site <- as.character(combined_data$Site)

# Define a function to calculate SPI3 for one site
calculate_spi3 <- function(data) {
  spi_values <- spi(data$Precipitation, scale = 3)$fitted
  return(spi_values)
}

# Apply the function to each site for SPI3 calculation
spi_data <- combined_data %>%
  group_by(Site) %>%
  arrange(Date) %>%
  mutate(
    SPI_3 = calculate_spi3(cur_data())  # Calculate SPI for 3 months
  ) %>%
  ungroup()

# Define a function to save SPI results for one site using the original file name
save_spi_results <- function(data, file_path) {
  site_name <- str_remove(basename(file_path), "\\.xlsx$")
  output_file <- file.path("write_file_directory", paste0(site_name, ".csv"))
  
  print(paste("Saving to:", output_file))
  tryCatch({
    write_csv(data, output_file)
    print(paste("Successfully saved to:", output_file))
  }, error = function(e) {
    print(paste("Error saving file:", e))
  })
}

# Split data by site and save each using the original file names
file_names <- basename(file_paths)
spi_split <- split(spi_data, spi_data$Site)
for (i in seq_along(file_names)) {
  save_spi_results(spi_split[[as.character(i)]], file_paths[[i]])
}
