@ECHO OFF
TITLE Docker Compose Shutdown Script

REM --- CONFIGURATION ---
REM Set the full path to the folder containing your docker-compose.yml file.
SET COMPOSE_PATH="H:\Documents\Projects\VeggieTable"


ECHO.
ECHO =================================================================
ECHO  Docker Compose Shutdown and Cleanup
ECHO =================================================================
ECHO.
ECHO  This script will navigate to the following directory:
ECHO  %COMPOSE_PATH%
ECHO.
ECHO  It will then execute the command: 'docker compose down -v'
ECHO.
ECHO  WARNING: This will STOP and REMOVE all containers, networks,
ECHO  and anonymous volumes associated with this project.
ECHO.
ECHO  (Note: Your data in mapped folders like M:\... will NOT be deleted.)
ECHO.



ECHO.
ECHO Navigating to the directory...
cd /d %COMPOSE_PATH%

ECHO.
ECHO Shutting down containers and removing volumes...
docker compose down -v

ECHO.
ECHO Operation complete.

ECHO.
PAUSE