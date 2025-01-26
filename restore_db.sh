#!/bin/bash

# Set up using chmod +x restore_db.sh and a cron job to run it daily

# Define the backup directory
BACKUP_DIR="./backup/db"

# Log function for consistent messaging
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Check if the backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
  log "Backup directory '$BACKUP_DIR' does not exist. Please ensure the directory is created and contains backup files."
  exit 1
fi

# List available backup files in the backup directory
BACKUP_FILES=($(ls "$BACKUP_DIR" | grep '\.gz$'))

# Check if there are any backup files
if [ ${#BACKUP_FILES[@]} -eq 0 ]; then
  log "No backup files found in '$BACKUP_DIR'. Exiting."
  exit 1
fi

log "Available backup files in '$BACKUP_DIR':"
for i in "${!BACKUP_FILES[@]}"; do
  FILE_SIZE=$(du -h "$BACKUP_DIR/${BACKUP_FILES[$i]}" | cut -f1)
  echo "$((i+1))) ${BACKUP_FILES[$i]} (Size: $FILE_SIZE)"
done

# Prompt the user to select a file by number
while true; do
  read -p "Enter the number of the backup file to restore (1-${#BACKUP_FILES[@]}): " SELECTION

  # Validate the input
  if [[ "$SELECTION" =~ ^[0-9]+$ ]] && [ "$SELECTION" -ge 1 ] && [ "$SELECTION" -le ${#BACKUP_FILES[@]} ]; then
    BACKUP_FILE="${BACKUP_FILES[$((SELECTION-1))]}"
    log "Backup file '$BACKUP_FILE' selected."
    break
  else
    log "Invalid selection. Please enter a number between 1 and ${#BACKUP_FILES[@]}."
  fi
done

# Ask the user if they want to back up the current database
read -p "Do you want to back up the current database before restoring? (y/n): " BACKUP_CURRENT
if [[ "$BACKUP_CURRENT" == "y" || "$BACKUP_CURRENT" == "Y" ]]; then
  # Generate a filename with the current date
  CURRENT_BACKUP_FILE="$BACKUP_DIR/backup_before_restore_$(date +%Y-%m-%d_%H-%M-%S).gz"
  log "Backing up the current database to '$CURRENT_BACKUP_FILE'..."

  # Perform the backup
  docker-compose exec -T mongo mongodump --archive --gzip --db elsalon > "$CURRENT_BACKUP_FILE"

  # Check if the backup was successful
  if [ $? -eq 0 ]; then
    log "Backup of the current database completed successfully: $CURRENT_BACKUP_FILE"
  else
    log "Backup of the current database failed. Restore will not proceed."
    exit 1
  fi
else
  log "Skipping backup of the current database."
fi

# Confirm restoration with the user
read -p "Are you sure you want to restore from '$BACKUP_FILE'? This will overwrite existing data. (y/n): " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  log "Restoration canceled."
  exit 0
fi

# Perform the restore
log "Starting restoration from '$BACKUP_FILE'..."
docker-compose exec -T mongo mongorestore --archive --gzip --drop < "$BACKUP_DIR/$BACKUP_FILE"

# Check if the restore was successful
if [ $? -eq 0 ]; then
  log "Restoration completed successfully."
else
  log "Restoration failed. Please check the backup file and try again."
  exit 1
fi