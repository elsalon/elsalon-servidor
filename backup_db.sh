#!/bin/bash

# This script performs a mongodump of the elsalon database in the mongo container
# and saves it to a .gz file in the backup directory. It also deletes .gz files older
# than a specified number of days in the backup directory.
# Set up using chmod +x backup.sh and a chron job to run it daily

# Define the backup directory
BACKUP_DIR="./backup/db"

# Define the number of days to keep backups
DAYS_TO_KEEP=10

# Create the backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate a filename with the current date
BACKUP_FILE="$BACKUP_DIR/dump_$(date +%Y-%m-%d_%H-%M-%S).gz"

# Perform the mongodump and save it to the backup file
docker-compose exec -T mongo mongodump --archive --gzip > "$BACKUP_FILE"

# Check if the backup was successful
if [ $? -eq 0 ]; then
  echo "Backup successful: $BACKUP_FILE"
else
  echo "Backup failed"
  exit 1
fi

# Delete .gz files older than DAYS_TO_KEEP in the backup directory
find "$BACKUP_DIR" -name "*.gz" -type f -mtime +$DAYS_TO_KEEP -exec rm -f {} \;

echo "Deleted .gz files older than $DAYS_TO_KEEP days in $BACKUP_DIR"