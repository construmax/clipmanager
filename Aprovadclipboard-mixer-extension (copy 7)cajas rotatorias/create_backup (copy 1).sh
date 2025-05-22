#!/bin/bash
TIMESTAMP=20240722_065104
BACKUP_FOLDER="../clipboard-mixer-extension-backup-$TIMESTAMP"
cp -r . "$BACKUP_FOLDER"
echo "Se ha creado un backup en $BACKUP_FOLDER"
