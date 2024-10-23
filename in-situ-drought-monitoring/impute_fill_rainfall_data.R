# Install and load necessary packages

library(readxl)   # for reading Excel files
library(mice)     # for multiple imputation
library(dplyr)    # for data manipulation
library(writexl)  # for writing Excel files

# Read the Excel file
data <- read_excel("read_file_directory")

# Check for missing values before imputation
print(colSums(is.na(data)))

# Replace specific string representations of missing values with NA
data <- data %>%
  mutate_all(~ ifelse(. %in% c(' ', '-   ', '-', '         '), NA, .))

# Replace 0 values with NA, if appropriate
# (Uncomment the following line if you want to replace 0 values with NA)
# data <- data %>% mutate_all(~ ifelse(. == 0, NA, .))

# Perform multiple imputation using MICE
imputed_data <- mice(data, method = "pmm", m = 5, maxit = 50, seed = 123)

# Combine the imputed datasets
completed_data <- complete(imputed_data, 1)  # You can choose any of the completed datasets

# Check for missing values after imputation
print(colSums(is.na(completed_data)))

# Write the imputed data back to an Excel file
write_xlsx(completed_data, "write_file_directory")



