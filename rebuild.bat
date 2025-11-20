@echo off
REM This batch file automates the process of rebuilding and restarting Docker containers.
REM It ensures each command completes before the next one begins.

REM Set the title of the command prompt window
TITLE Rebuilding VeggieTable Docker Containers

REM Change to the project directory. The /d switch is used to change drives if necessary.
cd /d "H:\Documents\Projects\VeggieTable"

REM Inform the user what is happening
echo.
echo [INFO] Tearing down existing containers and removing orphans...
echo.

REM Run the first command
docker-compose down --remove-orphans

REM Inform the user about the next step
echo.
echo [INFO] Building new images for frontend and backend without using cache...
echo.

REM Run the second command
docker-compose build --no-cache frontend backend

REM Inform the user about the final step
echo.
echo [INFO] Starting new containers in detached mode...
echo.

REM Run the third command
docker-compose up -d frontend backend

echo.
echo [SUCCESS] Script finished. The containers should be up and running.
echo.

REM Pause the script to keep the window open so you can see the final output.
pause
