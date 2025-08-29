"""
File cleanup utility to remove old uploaded and processed files
"""
import os
import time
from datetime import datetime, timedelta


def cleanup_old_files(max_age_hours: int = 24) -> int:
    """
    Remove files older than specified hours from uploads and outputs directories
    
    Args:
        max_age_hours: Maximum age of files in hours before deletion
    
    Returns:
        Number of files deleted
    """
    deleted_count = 0
    current_time = time.time()
    max_age_seconds = max_age_hours * 3600
    
    directories_to_clean = ['uploads', 'outputs']
    
    for directory in directories_to_clean:
        if not os.path.exists(directory):
            continue
        
        for filename in os.listdir(directory):
            file_path = os.path.join(directory, filename)
            
            # Skip directories and .gitkeep files
            if os.path.isdir(file_path) or filename == '.gitkeep':
                continue
            
            try:
                file_age = current_time - os.path.getmtime(file_path)
                
                if file_age > max_age_seconds:
                    os.remove(file_path)
                    deleted_count += 1
                    print(f"Deleted old file: {file_path}")
            
            except OSError as e:
                print(f"Error deleting file {file_path}: {e}")
    
    return deleted_count


def setup_cleanup_cron():
    """
    Setup cron job for automatic file cleanup
    This is a placeholder - in production, you'd set up an actual cron job
    """
    print("To set up automatic cleanup, add this to your crontab:")
    print("0 */6 * * * cd /path/to/your/app && python cleanup.py")


if __name__ == "__main__":
    print(f"Starting cleanup at {datetime.now()}")
    deleted = cleanup_old_files()
    print(f"Cleanup completed. Deleted {deleted} files.")
